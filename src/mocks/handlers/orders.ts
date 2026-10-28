import { delay, HttpResponse } from 'msw'
import { createOrderRequestSchema, IDEMPOTENCY_HEADER, type Order } from '@/contracts'
import { db, nextId, persist, walletConnections, type OrderRecord, type UserRecord } from '../db'
import { changeNft } from '../catalog'
import { getCart, priceCart, type PricedCart } from '../carts'
import { MockError, notFound, parseBody, route } from '../http'
import { emitOrderUpdated } from '../realtime'
import { firstTime, isScenario } from '../scenarios'
import { requireUser } from '../session'
import { findOwnWallet } from './wallets'

// Tempo "minerando o bloco" até a confirmação ou recusa.
const SETTLE_AFTER_MS = 4000
// Maior que o timeout do cliente (10 s): o pedido existe, mas a resposta não chega a tempo.
const ORDER_TIMEOUT_DELAY_MS = 15_000

// Hash fictício e determinístico (FNV-1a em rodadas): o mesmo pedido sempre gera o mesmo TxHash.
function txHashFor(seed: string) {
  let hex = ''
  for (let round = 0; hex.length < 64; round++) {
    let hash = 0x811c9dc5
    for (const char of `${seed}:${round}`) hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193)
    hex += (hash >>> 0).toString(16).padStart(8, '0')
  }
  return `0x${hex}`
}

// O que importa para o pedido valer: se mudou desde a cotação, o usuário precisa reconfirmar.
const quoteFingerprint = ({ network, items, coupon, subtotal, discount, gasFee, total }: PricedCart) =>
  JSON.stringify([network, items, coupon, subtotal, discount, gasFee, total])

// Tiragem fica reservada enquanto o pedido está pendente; volta se a transação for recusada.
function adjustAvailability(order: Order, direction: -1 | 1) {
  for (const item of order.items) {
    const nft = db.nfts.find((n) => n.id === item.nftId)!
    const edition = nft.editions.find((e) => e.id === item.editionId)!
    changeNft(nft, () => (edition.available += direction * item.quantity))
  }
}

// Remove do carrinho só o que foi comprado, nas quantidades compradas.
function removePurchased({ order, userId }: OrderRecord) {
  const cart = getCart(`user:${userId}`)
  for (const item of order.items) {
    const line = cart.lines.find((l) => l.nftId === item.nftId && l.editionId === item.editionId)
    if (line) line.quantity -= item.quantity
  }
  cart.lines = cart.lines.filter((line) => line.quantity > 0)
  if (order.coupon && cart.couponCode === order.coupon.code) cart.couponCode = null
  cart.updatedAt = new Date().toISOString()
}

function settle(record: OrderRecord) {
  const { order } = record
  if (order.status !== 'pending') return
  order.status = record.outcome
  order.version += 1
  order.updatedAt = new Date().toISOString()
  if (record.outcome === 'confirmed') {
    order.txHash = txHashFor(order.id)
    order.blockNumber = 4_200_000 + db.sequence
    order.explorerUrl = `https://explorer.toonvault.example/tx/${order.txHash}`
    removePurchased(record)
  } else {
    order.reason = 'A transação foi recusada pela rede. Nenhum valor foi cobrado.'
    adjustAvailability(order, 1)
  }
  persist()
  emitOrderUpdated(record)
}

function scheduleSettlement(record: OrderRecord) {
  setTimeout(() => settle(record), Math.max(0, Date.parse(record.settlesAt) - Date.now()))
}

// Ao carregar a página, os pedidos pendentes voltam a "minerar" de onde pararam.
export function resumePendingOrders() {
  for (const record of db.orders) if (record.order.status === 'pending') scheduleSettlement(record)
}

// Leitura também confirma o que já venceu, caso o timer não tenha rodado (aba suspensa).
function readOrder(record: OrderRecord) {
  if (record.order.status === 'pending' && Date.parse(record.settlesAt) <= Date.now()) settle(record)
  return record.order
}

function findOwnOrder(user: UserRecord, id: string) {
  const record = db.orders.find((r) => r.order.id === id) ?? notFound('Pedido não encontrado.')
  if (record.userId !== user.id) throw new MockError(403, 'FORBIDDEN', 'Este pedido pertence a outro colecionador.')
  return record
}

export const orderHandlers = [
  route('post', '/orders', async ({ request }) => {
    const user = requireUser(request)
    const key = request.headers.get(IDEMPOTENCY_HEADER)
    if (!key) {
      throw new MockError(400, 'VALIDATION_ERROR', `Envie o header ${IDEMPOTENCY_HEADER}.`, { [IDEMPOTENCY_HEADER]: 'Obrigatório' })
    }
    const body = await parseBody(request, createOrderRequestSchema)
    const fingerprint = JSON.stringify(body)

    // Mesma tentativa devolve o mesmo pedido; mesma chave com outro conteúdo é conflito.
    const previous = db.idempotency[key]
    if (previous) {
      if (previous.userId !== user.id || previous.fingerprint !== fingerprint) {
        throw new MockError(409, 'IDEMPOTENCY_CONFLICT', 'Esta tentativa de compra já foi usada com outros dados.')
      }
      return HttpResponse.json(readOrder(db.orders.find((r) => r.order.id === previous.orderId)!))
    }

    const stored = db.quotes[body.quoteId]
    if (!stored || stored.cartId !== `user:${user.id}`) notFound('Cotação não encontrada.')
    if (Date.parse(stored.quote.expiresAt) <= Date.now() || stored.quote.network !== body.network) {
      throw new MockError(409, 'QUOTE_CHANGED', 'A cotação expirou. Revise os valores e confirme de novo.')
    }

    const wallet = findOwnWallet(user, body.walletId)
    if (walletConnections.get(wallet.id) !== body.network) {
      throw new MockError(409, 'WALLET_DISCONNECTED', 'Conecte a carteira na rede escolhida antes de assinar.')
    }
    if (isScenario('wallet-disconnected') && firstTime('wallet-disconnected')) {
      walletConnections.delete(wallet.id)
      throw new MockError(409, 'WALLET_DISCONNECTED', `${wallet.label} desconectou antes de assinar. Conecte de novo.`)
    }

    // Revalida preço, tiragem, cupom e taxa contra o estado atual.
    const current = priceCart(getCart(stored.cartId), body.network)
    if (quoteFingerprint(current) !== quoteFingerprint(stored.quote)) {
      throw new MockError(409, 'QUOTE_CHANGED', 'Preço, tiragem, cupom ou taxa mudaram. Revise a nova cotação.')
    }

    const now = Date.now()
    const order: Order = {
      id: nextId('order'),
      status: 'pending',
      version: 1,
      network: body.network,
      wallet: { id: wallet.id, label: wallet.label, address: wallet.address },
      collector: body.collector,
      items: current.items.map(({ itemId, ...item }) => item),
      coupon: current.coupon,
      subtotal: current.subtotal,
      discount: current.discount,
      gasFee: current.gasFee,
      total: current.total,
      txHash: null,
      blockNumber: null,
      explorerUrl: null,
      reason: null,
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString(),
    }
    const record: OrderRecord = {
      order,
      userId: user.id,
      outcome: isScenario('tx-rejected') ? 'rejected' : 'confirmed',
      settlesAt: new Date(now + SETTLE_AFTER_MS).toISOString(),
    }
    db.orders.push(record)
    db.idempotency[key] = { userId: user.id, fingerprint, orderId: order.id }
    adjustAvailability(order, -1)
    scheduleSettlement(record)

    if (isScenario('order-timeout') && firstTime('order-timeout')) {
      persist()
      await delay(ORDER_TIMEOUT_DELAY_MS)
    }
    return HttpResponse.json(order, { status: 201 })
  }),

  route('get', '/orders', ({ request }) => {
    const user = requireUser(request)
    const items = db.orders
      .filter((record) => record.userId === user.id)
      .map(readOrder)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return HttpResponse.json({ items })
  }),

  route('get', '/orders/:id', ({ request, params }) =>
    HttpResponse.json(readOrder(findOwnOrder(requireUser(request), params.id!))),
  ),
]
