import { HttpResponse } from 'msw'
import {
  connectWalletRequestSchema,
  createWalletRequestSchema,
  updateWalletRequestSchema,
  type Wallet,
  type WalletConnection,
} from '@/contracts'
import { db, nextId, walletConnections, type UserRecord, type WalletRecord } from '../db'
import { MockError, noContent, notFound, parseBody, route } from '../http'
import { isScenario } from '../scenarios'
import { requireUser } from '../session'

const ROLE_NAMES = { primary: 'principal', secondary: 'secundária' }

const toWallet = ({ userId, ...wallet }: WalletRecord): Wallet => wallet

export function findOwnWallet(user: UserRecord, id: string) {
  const wallet = db.wallets.find((w) => w.id === id) ?? notFound('Carteira não encontrada.')
  if (wallet.userId !== user.id) throw new MockError(403, 'FORBIDDEN', 'Esta carteira pertence a outro colecionador.')
  return wallet
}

export const walletHandlers = [
  route('get', '/wallets', ({ request }) => {
    const user = requireUser(request)
    const items = db.wallets
      .filter((w) => w.userId === user.id)
      .sort((a, b) => a.role.localeCompare(b.role))
      .map(toWallet)
    return HttpResponse.json({ items })
  }),

  // Uma carteira principal e uma secundária por colecionador.
  route('post', '/wallets', async ({ request }) => {
    const user = requireUser(request)
    const body = await parseBody(request, createWalletRequestSchema)
    if (db.wallets.some((w) => w.userId === user.id && w.role === body.role)) {
      throw new MockError(422, 'VALIDATION_ERROR', 'Confira os campos destacados.', {
        role: `Você já tem uma carteira ${ROLE_NAMES[body.role]}`,
      })
    }
    const now = new Date().toISOString()
    const wallet: WalletRecord = { id: nextId('wallet'), userId: user.id, ...body, createdAt: now, updatedAt: now }
    db.wallets.push(wallet)
    return HttpResponse.json(toWallet(wallet), { status: 201 })
  }),

  route('patch', '/wallets/:id', async ({ request, params }) => {
    const wallet = findOwnWallet(requireUser(request), params.id!)
    const body = await parseBody(request, updateWalletRequestSchema)
    Object.assign(wallet, body, { updatedAt: new Date().toISOString() })
    walletConnections.delete(wallet.id)
    return HttpResponse.json(toWallet(wallet))
  }),

  route('post', '/wallets/:id/connect', async ({ request, params }) => {
    const wallet = findOwnWallet(requireUser(request), params.id!)
    const { network } = await parseBody(request, connectWalletRequestSchema)
    if (isScenario('wallet-rejected')) throw new MockError(409, 'WALLET_REJECTED', `A conexão foi recusada na carteira ${wallet.label}.`)
    walletConnections.set(wallet.id, network)
    return HttpResponse.json<WalletConnection>({ walletId: wallet.id, network, connectedAt: new Date().toISOString() })
  }),

  route('delete', '/wallets/:id/connect', ({ request, params }) => {
    const wallet = findOwnWallet(requireUser(request), params.id!)
    walletConnections.delete(wallet.id)
    return noContent()
  }),
]
