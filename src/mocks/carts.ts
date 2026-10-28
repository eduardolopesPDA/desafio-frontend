import { GUEST_CART_HEADER, type Cart, type Edition, type NetworkId, type Quote } from '@/contracts'
import { db, type CartRecord, type NftRecord, type UserRecord } from './db'
import { couponFixtures, gasFeeFixtures, type CouponFixture } from './fixtures'
import { MockError } from './http'
import { capAt, minus, percentOf, sum, times, ZERO } from './db/money'

// Usuário logado usa o próprio carrinho; visitante, o do header X-Guest-Cart-Id.
export function cartIdFor(request: Request, user: UserRecord | null) {
  if (user) return `user:${user.id}`
  const guestId = request.headers.get(GUEST_CART_HEADER)
  if (!guestId) throw new MockError(401, 'UNAUTHENTICATED', `Entre com seu Toon Pass ou envie ${GUEST_CART_HEADER}.`)
  return `guest:${guestId}`
}

export function getCart(id: string): CartRecord {
  db.carts[id] ??= { id, lines: [], couponCode: null, updatedAt: new Date().toISOString() }
  return db.carts[id]
}

function lineParts(nftId: string, editionId: string) {
  const nft = db.nfts.find((n) => n.id === nftId)!
  return { nft, edition: nft.editions.find((e) => e.id === editionId)! }
}

function availableIn(nft: NftRecord, edition: Edition) {
  return nft.status === 'burned' ? 0 : edition.available
}

export function assertQuantity(nft: NftRecord, edition: Edition, quantity: number) {
  const available = availableIn(nft, edition)
  const label = `${nft.name} (${edition.name})`
  if (available === 0) throw new MockError(409, 'SOLD_OUT', `${label} está esgotado.`)
  if (quantity > available) throw new MockError(409, 'EDITION_LIMIT', `Só restam ${available} de ${label}.`)
  if (quantity > nft.maxPerOrder) throw new MockError(409, 'EDITION_LIMIT', `Limite de ${nft.maxPerOrder} por pedido para ${nft.name}.`)
}

export function findCoupon(code: string): CouponFixture {
  const coupon = couponFixtures.find((c) => c.code === code)
  if (!coupon) throw new MockError(422, 'COUPON_INVALID', `O cupom ${code} não existe.`, { code: 'Cupom inválido' })
  if (Date.parse(coupon.expiresAt) <= Date.now()) {
    throw new MockError(422, 'COUPON_EXPIRED', `O cupom ${code} expirou.`, { code: 'Cupom expirado' })
  }
  return coupon
}

function couponView(code: string | null) {
  const coupon = code ? couponFixtures.find((c) => c.code === code) : undefined
  return coupon ? { code: coupon.code, description: coupon.description } : null
}

// Preço e disponibilidade são lidos do catálogo agora: o carrinho reflete o nft.updated.
export function cartView(cart: CartRecord): Cart {
  return {
    id: cart.id,
    items: cart.lines.map((line) => {
      const { nft, edition } = lineParts(line.nftId, line.editionId)
      return {
        id: line.id,
        nftId: nft.id,
        editionId: edition.id,
        editionName: edition.name,
        name: nft.name,
        image: nft.gallery[0]!,
        quantity: line.quantity,
        unitPrice: nft.price,
        available: availableIn(nft, edition),
        maxPerOrder: nft.maxPerOrder,
      }
    }),
    coupon: couponView(cart.couponCode),
    updatedAt: cart.updatedAt,
  }
}

export type PricedCart = Omit<Quote, 'id' | 'createdAt' | 'expiresAt'>

// Valida tiragem e cupom e calcula os valores. Base da cotação e da revalidação do pedido.
export function priceCart(cart: CartRecord, network: NetworkId): PricedCart {
  if (cart.lines.length === 0) throw new MockError(422, 'VALIDATION_ERROR', 'O cofre está vazio.')

  // Problemas de tiragem por item (chave = id do item no carrinho).
  const issues: Record<string, string> = {}
  let code: 'SOLD_OUT' | 'EDITION_LIMIT' = 'EDITION_LIMIT'
  for (const line of cart.lines) {
    const { nft, edition } = lineParts(line.nftId, line.editionId)
    try {
      assertQuantity(nft, edition, line.quantity)
    } catch (error) {
      if (!(error instanceof MockError)) throw error
      issues[line.id] = error.message
      if (error.code === 'SOLD_OUT') code = 'SOLD_OUT'
    }
  }
  const messages = Object.values(issues)
  if (messages.length > 0) {
    throw new MockError(409, code, messages.length === 1 ? messages[0]! : 'Alguns itens do cofre mudaram de disponibilidade.', issues)
  }

  const items = cartView(cart).items.map(({ id, nftId, editionId, editionName, name, image, quantity, unitPrice }) => ({
    itemId: id,
    nftId,
    editionId,
    editionName,
    name,
    image,
    quantity,
    unitPrice,
    lineTotal: times(unitPrice, quantity),
  }))
  const subtotal = sum(items.map((item) => item.lineTotal))
  const coupon = cart.couponCode ? findCoupon(cart.couponCode) : null
  const discount = !coupon ? ZERO : coupon.kind === 'percent' ? percentOf(subtotal, coupon.percent) : capAt(coupon.amount, subtotal)
  const gasFee = gasFeeFixtures[network]

  return {
    network,
    items,
    coupon: couponView(coupon?.code ?? null),
    subtotal,
    discount,
    gasFee,
    total: sum([minus(subtotal, discount), gasFee]),
  }
}
