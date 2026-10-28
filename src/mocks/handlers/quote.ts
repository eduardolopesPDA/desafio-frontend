import { HttpResponse } from 'msw'
import { quoteRequestSchema, type Quote } from '@/contracts'
import { db, nextId, type CartRecord } from '../db'
import { changeNft } from '../catalog'
import { cartIdFor, getCart, priceCart } from '../carts'
import { scale } from '../db/money'
import { parseBody, route } from '../http'
import { firstTime, isScenario } from '../scenarios'
import { currentUser } from '../session'

const QUOTE_TTL_MS = 10 * 60 * 1000
const MARKET_CHANGE_DELAY_MS = 1500

// Cenários `price-changed` e `sold-out`: o mercado muda logo depois da cotação, via nft.updated,
// e o pedido feito com a cotação antiga recebe 409 QUOTE_CHANGED.
function scheduleMarketChange(cart: CartRecord) {
  const line = cart.lines[0]
  const nft = db.nfts.find((n) => n.id === line?.nftId)
  if (!line || !nft) return

  if (isScenario('price-changed') && firstTime('price-changed')) {
    setTimeout(() => changeNft(nft, (n) => (n.price = scale(n.price, '1.1'))), MARKET_CHANGE_DELAY_MS)
  }
  if (isScenario('sold-out') && firstTime('sold-out')) {
    const edition = nft.editions.find((e) => e.id === line.editionId)!
    setTimeout(() => changeNft(nft, () => (edition.available = 0)), MARKET_CHANGE_DELAY_MS)
  }
}

function pruneExpiredQuotes() {
  for (const [id, { quote }] of Object.entries(db.quotes)) {
    if (Date.parse(quote.expiresAt) <= Date.now()) delete db.quotes[id]
  }
}

export const quoteHandlers = [
  route('post', '/quote', async ({ request }) => {
    const cart = getCart(cartIdFor(request, currentUser(request)))
    const { network } = await parseBody(request, quoteRequestSchema)
    const now = Date.now()
    const quote: Quote = {
      id: nextId('quote'),
      ...priceCart(cart, network),
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + QUOTE_TTL_MS).toISOString(),
    }
    pruneExpiredQuotes()
    db.quotes[quote.id] = { quote, cartId: cart.id }
    scheduleMarketChange(cart)
    return HttpResponse.json(quote)
  }),
]
