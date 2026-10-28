import type { NetworkId, Order, Quote } from '@/contracts'
import {
  favoriteFixtures,
  nftFixtures,
  userFixtures,
  walletFixtures,
  type NftFixture,
  type UserFixture,
  type WalletFixture,
} from '../fixtures'

export type NftRecord = NftFixture & { version: number }
export type UserRecord = UserFixture
export type WalletRecord = WalletFixture
export type SessionRecord = { token: string; userId: string; expiresAt: string }
export type CartLine = { id: string; nftId: string; editionId: string; quantity: number }
// Carrinho de usuário: `user:<id>`; de visitante: `guest:<X-Guest-Cart-Id>`.
export type CartRecord = { id: string; lines: CartLine[]; couponCode: string | null; updatedAt: string }
// O que sai na API fica em `quote`/`order`; o resto é estado interno do servidor.
export type QuoteRecord = { quote: Quote; cartId: string }
export type OrderRecord = {
  order: Order
  userId: string
  // Resultado e momento da confirmação no "bloco", decididos na criação para sobreviver a refresh.
  outcome: 'confirmed' | 'rejected'
  settlesAt: string
}
export type IdempotencyRecord = { userId: string; fingerprint: string; orderId: string }

type DbState = {
  schema: number
  sequence: number
  nfts: NftRecord[]
  users: UserRecord[]
  sessions: SessionRecord[]
  favorites: Record<string, string[]>
  carts: Record<string, CartRecord>
  quotes: Record<string, QuoteRecord>
  orders: OrderRecord[]
  idempotency: Record<string, IdempotencyRecord>
  wallets: WalletRecord[]
}

const STORAGE_KEY = 'cn-toon-vault:mock-db'
// Suba quando o formato mudar: um estado salvo de outra versão é descartado.
const SCHEMA = 1

function initialState(): DbState {
  return structuredClone({
    schema: SCHEMA,
    sequence: 0,
    nfts: nftFixtures.map((nft) => ({ ...nft, version: 1 })),
    users: userFixtures,
    sessions: [],
    favorites: favoriteFixtures,
    carts: {},
    quotes: {},
    orders: [],
    idempotency: {},
    wallets: walletFixtures,
  })
}

// Fora do navegador (Vitest) não há localStorage: o estado vive só em memória.
function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

function load(): DbState {
  const saved = storage()?.getItem(STORAGE_KEY)
  if (saved) {
    const parsed = JSON.parse(saved) as DbState
    if (parsed.schema === SCHEMA) return parsed
  }
  return initialState()
}

export const db: DbState = load()

export function persist() {
  storage()?.setItem(STORAGE_KEY, JSON.stringify(db))
}

// Restaura o universo padrão: fixtures, sem sessões, carrinhos nem pedidos.
export function resetDb() {
  Object.assign(db, initialState())
  persist()
}

export function nextId(prefix: string) {
  db.sequence += 1
  return `${prefix}-${db.sequence}`
}

// Estado que não sobrevive a refresh, como numa carteira de verdade: conexões ativas.
export const walletConnections = new Map<string, NetworkId>()
