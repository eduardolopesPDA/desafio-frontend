import { HttpResponse } from 'msw'
import { addCartItemRequestSchema, applyCouponRequestSchema, GUEST_CART_HEADER, updateCartItemRequestSchema } from '@/contracts'
import { db, nextId, type CartRecord } from '../db'
import { findActiveNft, findEdition } from '../catalog'
import { assertQuantity, cartIdFor, cartView, findCoupon, getCart } from '../carts'
import { MockError, notFound, parseBody, route } from '../http'
import { currentUser, requireUser } from '../session'

function cartOf(request: Request) {
  return getCart(cartIdFor(request, currentUser(request)))
}

function findLine(cart: CartRecord, itemId: string) {
  return cart.lines.find((line) => line.id === itemId) ?? notFound('Item não está no cofre.')
}

function respond(cart: CartRecord, status = 200) {
  cart.updatedAt = new Date().toISOString()
  return HttpResponse.json(cartView(cart), { status })
}

export const cartHandlers = [
  route('get', '/cart', ({ request }) => HttpResponse.json(cartView(cartOf(request)))),

  // Mesmo NFT e edição somam na linha existente.
  route('post', '/cart/items', async ({ request }) => {
    const cart = cartOf(request)
    const body = await parseBody(request, addCartItemRequestSchema)
    const nft = findActiveNft(body.nftId)
    const edition = findEdition(nft, body.editionId)
    const line = cart.lines.find((l) => l.nftId === nft.id && l.editionId === edition.id)
    assertQuantity(nft, edition, (line?.quantity ?? 0) + body.quantity)

    if (line) line.quantity += body.quantity
    else cart.lines.push({ id: nextId('item'), nftId: nft.id, editionId: edition.id, quantity: body.quantity })
    return respond(cart, 201)
  }),

  route('patch', '/cart/items/:itemId', async ({ request, params }) => {
    const cart = cartOf(request)
    const line = findLine(cart, params.itemId!)
    const { quantity } = await parseBody(request, updateCartItemRequestSchema)
    const nft = db.nfts.find((n) => n.id === line.nftId)!
    assertQuantity(nft, findEdition(nft, line.editionId), quantity)
    line.quantity = quantity
    return respond(cart)
  }),

  route('delete', '/cart/items/:itemId', ({ request, params }) => {
    const cart = cartOf(request)
    const line = findLine(cart, params.itemId!)
    cart.lines = cart.lines.filter((l) => l !== line)
    return respond(cart)
  }),

  route('put', '/cart/coupon', async ({ request }) => {
    const cart = cartOf(request)
    const { code } = await parseBody(request, applyCouponRequestSchema)
    cart.couponCode = findCoupon(code).code
    return respond(cart)
  }),

  route('delete', '/cart/coupon', ({ request }) => {
    const cart = cartOf(request)
    cart.couponCode = null
    return respond(cart)
  }),

  // Após o login: os itens do visitante entram no carrinho do usuário, limitados à tiragem.
  route('post', '/cart/merge', ({ request }) => {
    const user = requireUser(request)
    const guestId = request.headers.get(GUEST_CART_HEADER)
    if (!guestId) throw new MockError(400, 'VALIDATION_ERROR', `Envie o header ${GUEST_CART_HEADER}.`)
    const cart = getCart(`user:${user.id}`)
    const guest = db.carts[`guest:${guestId}`]
    if (!guest) return respond(cart)

    for (const guestLine of guest.lines) {
      const nft = db.nfts.find((n) => n.id === guestLine.nftId)!
      const edition = findEdition(nft, guestLine.editionId)
      const limit = nft.status === 'burned' ? 0 : Math.min(edition.available, nft.maxPerOrder)
      const line = cart.lines.find((l) => l.nftId === nft.id && l.editionId === edition.id)
      if (line) line.quantity = Math.max(line.quantity, Math.min(line.quantity + guestLine.quantity, limit))
      else if (limit > 0) cart.lines.push({ ...guestLine, quantity: Math.min(guestLine.quantity, limit) })
    }
    cart.couponCode ??= guest.couponCode
    delete db.carts[guest.id]
    return respond(cart)
  }),
]
