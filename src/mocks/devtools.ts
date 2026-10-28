import type { Money } from '@/contracts'
import { db, persist, resetDb, walletConnections } from './db'
import { changeNft } from './catalog'
import { disconnectSockets } from './realtime'
import { getScenario, SCENARIOS, setScenario } from './scenarios'

type NftChange = { price?: Money; editions?: Record<string, number> }

// Controles do "servidor" para demonstração, README e Playwright. Não é usado pela app.
const tools = {
  scenarios: () => Object.entries(SCENARIOS).map(([name, { description }]) => ({ name, description })),
  get scenario() {
    return getScenario()
  },
  // Vale para as próximas requisições; recarregue a página para começar do zero.
  setScenario,
  reset() {
    resetDb()
    walletConnections.clear()
  },
  // Simula expiração do Toon Pass: a próxima chamada privada responde 401 SESSION_EXPIRED.
  expireSessions() {
    const now = new Date().toISOString()
    for (const session of db.sessions) session.expiresAt = now
    persist()
  },
  // Muda preço/tiragem no "mercado" e emite nft.updated, como um evento real.
  updateNft(id: string, change: NftChange) {
    const nft = db.nfts.find((n) => n.id === id)
    if (!nft) throw new Error(`NFT desconhecido: ${id}`)
    changeNft(nft, () => {
      if (change.price) nft.price = change.price
      for (const edition of nft.editions) edition.available = change.editions?.[edition.id] ?? edition.available
    })
  },
  disconnectSockets,
}

declare global {
  interface Window {
    __cnMock?: typeof tools
  }
}

export function installDevtools() {
  window.__cnMock = tools
}

// ?scenario=<nome> escolhe o cenário (fica salvo) e ?reset restaura as fixtures.
// Os dois saem da URL antes de o router ler os search params.
export function applyUrlControls() {
  const url = new URL(window.location.href)
  const scenario = url.searchParams.get('scenario')
  if (scenario) setScenario(scenario)
  if (url.searchParams.has('reset')) tools.reset()
  if (scenario || url.searchParams.has('reset')) {
    url.searchParams.delete('scenario')
    url.searchParams.delete('reset')
    window.history.replaceState(window.history.state, '', url)
  }
}
