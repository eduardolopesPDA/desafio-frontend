import { delay } from 'msw'
import type { ApiErrorCode } from '@/contracts'

export type Failure =
  | { route: string; times?: number; networkError: true }
  | { route: string; times?: number; status: number; code: ApiErrorCode; message: string }

type ScenarioDefinition = {
  description: string
  // `count` é a n-ésima chamada à rota desde o carregamento da página.
  latency?: (route: string, count: number) => number
  // `route` é a chave da rota ("GET /nfts") ou "*" para todas.
  failures?: Failure[]
}

const DEFAULT_LATENCY_MS = 250
const BLOCKCHAIN_DOWN = 'A rede blockchain está fora do ar. Tente novamente em instantes.'

// Cenários com `latency`/`failures` agem na rede; os demais mudam regras de negócio nos
// handlers (via `isScenario`). Nomes estáveis: usados em ?scenario=, Playwright e README.
export const SCENARIOS = {
  default: { description: 'Sucesso, com latência fixa de 250 ms' },
  'slow-network': { description: 'Rede lenta: toda resposta leva 2,5 s', latency: () => 2500 },
  'variable-latency': {
    description: 'Latência variável entre 100 ms e 2 s, mesma sequência a cada carregamento',
    latency: () => 100 + Math.floor(random() * 1900),
  },
  'out-of-order': {
    description: 'Listagem do catálogo fora de ordem: chamadas ímpares levam 2 s, pares 300 ms',
    latency: (route, count) => (route === 'GET /nfts' ? (count % 2 === 1 ? 2000 : 300) : DEFAULT_LATENCY_MS),
  },
  'catalog-error': {
    description: 'Listagem do catálogo responde 503 nas 3 primeiras chamadas e depois se recupera',
    failures: [{ route: 'GET /nfts', times: 3, status: 503, code: 'NETWORK_UNAVAILABLE', message: 'O Toon Vault está instável. Tente novamente.' }],
  },
  'server-error': {
    description: 'Toda requisição responde 500',
    failures: [{ route: '*', status: 500, code: 'INTERNAL_ERROR', message: 'Erro interno no servidor.' }],
  },
  offline: { description: 'Sem conexão: toda requisição falha na rede', failures: [{ route: '*', networkError: true }] },
  'favorite-error': {
    description: 'Favoritar e desfavoritar respondem 503',
    failures: ['PUT', 'DELETE'].map((method) => ({
      route: `${method} /favorites/:nftId`,
      status: 503,
      code: 'NETWORK_UNAVAILABLE' as const,
      message: 'Não foi possível salvar a Toon Star.',
    })),
  },
  'blockchain-down': {
    description: 'Rede blockchain indisponível: criar pedido e conectar carteira respondem 503',
    failures: ['POST /orders', 'POST /wallets/:id/connect'].map((route) => ({
      route,
      status: 503,
      code: 'NETWORK_UNAVAILABLE' as const,
      message: BLOCKCHAIN_DOWN,
    })),
  },
  'price-changed': { description: 'Após a cotação, o preço do primeiro item do carrinho sobe 10% (nft.updated)' },
  'sold-out': { description: 'Após a cotação, a edição do primeiro item do carrinho esgota (nft.updated)' },
  'order-timeout': { description: 'O primeiro pedido é criado, mas a resposta leva 15 s (timeout no cliente)' },
  'tx-rejected': { description: 'Transações são recusadas na rede' },
  'wallet-rejected': { description: 'A carteira recusa a conexão' },
  'wallet-disconnected': { description: 'A carteira desconecta na primeira tentativa de assinar o pedido' },
  'duplicate-events': { description: 'Eventos de socket chegam duplicados e seguidos de uma versão antiga' },
} satisfies Record<string, ScenarioDefinition>

export type ScenarioName = keyof typeof SCENARIOS

const STORAGE_KEY = 'cn-toon-vault:mock-scenario'

function isScenarioName(value: unknown): value is ScenarioName {
  return typeof value === 'string' && Object.hasOwn(SCENARIOS, value)
}

// Escolha salva no navegador; sem ela, VITE_MSW_SCENARIO; sem ele, `default`.
function initialScenario(): ScenarioName {
  let saved: string | null | undefined
  try {
    saved = globalThis.localStorage?.getItem(STORAGE_KEY)
  } catch {
    saved = null
  }
  const configured: unknown = import.meta.env.VITE_MSW_SCENARIO
  return isScenarioName(saved) ? saved : isScenarioName(configured) ? configured : 'default'
}

let active: ScenarioName = initialScenario()
let latencyEnabled = true
const callCounts = new Map<string, number>()
const fired = new Set<string>()

// PRNG com semente fixa (mulberry32): latências variáveis, mas reproduzíveis.
let seed = 42
function random() {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export function getScenario() {
  return active
}

export function setScenario(name: string) {
  if (!isScenarioName(name)) throw new Error(`Cenário desconhecido: ${name}. Opções: ${Object.keys(SCENARIOS).join(', ')}`)
  active = name
  callCounts.clear()
  fired.clear()
  seed = 42
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, name)
  } catch {
    // Sem storage (Vitest): o cenário vale só para este processo.
  }
}

export function isScenario(name: ScenarioName) {
  return active === name
}

// Verdadeiro só na primeira vez por cenário ativo: gatilhos que acontecem uma vez.
export function firstTime(tag: string) {
  if (fired.has(tag)) return false
  fired.add(tag)
  return true
}

// Testes de API no Node desligam a latência para rodar rápido.
export function setLatencyEnabled(enabled: boolean) {
  latencyEnabled = enabled
}

// Aplica latência do cenário e devolve a falha forçada para esta chamada, se houver.
export async function simulateNetwork(route: string): Promise<Failure | undefined> {
  const count = (callCounts.get(route) ?? 0) + 1
  callCounts.set(route, count)

  const scenario: ScenarioDefinition = SCENARIOS[active]
  if (latencyEnabled) await delay(scenario.latency?.(route, count) ?? DEFAULT_LATENCY_MS)

  return scenario.failures?.find(
    (failure) => (failure.route === '*' || failure.route === route) && (failure.times === undefined || count <= failure.times),
  )
}
