import { afterEach, describe, expect, it, vi } from 'vitest'
import { cartSchema, IDEMPOTENCY_HEADER, orderSchema, quoteSchema, type CreateOrderRequest } from '@/contracts'
import { http } from '@/lib/http'
import { db } from '@/mocks/db'
import { changeNft } from '@/mocks/catalog'
import { setScenario } from '@/mocks/scenarios'
import { asGuest, failure, GUMBALL, login } from './helpers'

const ESPADA = { nftId: 'espada-de-sangue-de-demonio', editionId: 'classica' }
const COLLECTOR = { name: 'Finn Mertens', email: 'finchin@ooo.com', autographName: 'Para o Jake' }

async function addToCart(item: { nftId: string; editionId: string }, quantity = 1, config = {}) {
  return cartSchema.parse((await http.post('/cart/items', { ...item, quantity }, config)).data)
}

async function quote(network = 'ooo', config = {}) {
  return quoteSchema.parse((await http.post('/quote', { network }, config)).data)
}

function order(body: CreateOrderRequest, key = 'tentativa-1') {
  return http.post('/orders', body, { headers: { [IDEMPOTENCY_HEADER]: key } }).then(({ data }) => orderSchema.parse(data))
}

// Finn com a Espada no carrinho, cotação feita e carteira conectada na Ooo Network.
async function readyToBuy(quantity = 2) {
  await login()
  await addToCart(ESPADA, quantity)
  const current = await quote()
  await http.post('/wallets/wallet-finn-1/connect', { network: 'ooo' })
  return { quoteId: current.id, walletId: 'wallet-finn-1', network: 'ooo', collector: COLLECTOR } as const
}

// Avança o relógio para o pedido sair do "Minerando Bloco...".
function afterMining() {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(Date.now() + 5000)
}

afterEach(() => {
  vi.useRealTimers()
})

describe('Cofre', () => {
  it('soma a mesma edição na mesma linha e respeita o limite por pedido', async () => {
    await addToCart(ESPADA, 2, asGuest())
    const cart = await addToCart(ESPADA, 1, asGuest())
    expect(cart.items).toMatchObject([{ ...ESPADA, quantity: 3, unitPrice: { tc: '4200.00' } }])

    expect(await failure(addToCart(ESPADA, 1, asGuest()))).toMatchObject({ status: 409, code: 'EDITION_LIMIT' })
  })

  it('recusa edição esgotada', async () => {
    expect(await failure(addToCart({ nftId: 'moletom-do-rigby', editionId: 'classica' }, 1, asGuest()))).toMatchObject({
      status: 409,
      code: 'SOLD_OUT',
    })
  })

  it('aplica cupom válido e explica o inválido e o expirado', async () => {
    await addToCart(ESPADA, 1, asGuest())

    expect(await failure(http.put('/cart/coupon', { code: 'NAOEXISTE' }, asGuest()))).toMatchObject({ code: 'COUPON_INVALID' })
    expect(await failure(http.put('/cart/coupon', { code: 'cupom_reino_doce_expirado' }, asGuest()))).toMatchObject({
      code: 'COUPON_EXPIRED',
    })
    const cart = cartSchema.parse((await http.put('/cart/coupon', { code: 'bubblegum10' }, asGuest())).data)
    expect(cart.coupon?.code).toBe('BUBBLEGUM10')
  })

  it('separa carrinhos de visitantes e junta o do visitante ao logar', async () => {
    await addToCart({ nftId: 'chapeu-do-jeff', editionId: 'classica' }, 2, asGuest('a'))
    await addToCart(ESPADA, 1, asGuest('b'))

    await login()
    const merged = cartSchema.parse((await http.post('/cart/merge', null, asGuest('a'))).data)

    expect(merged.items.map((item) => [item.nftId, item.quantity])).toEqual([['chapeu-do-jeff', 2]])
    expect(db.carts['guest:a']).toBeUndefined()
  })
})

describe('Cotação', () => {
  it('calcula subtotal, desconto, gas fee e total em strings decimais', async () => {
    await addToCart(ESPADA, 2, asGuest())
    await http.put('/cart/coupon', { code: 'BUBBLEGUM10' }, asGuest())
    const result = await quote('elmore', asGuest())

    expect(result).toMatchObject({
      subtotal: { tc: '8400.00', eth: '2.8000' },
      discount: { tc: '840.00', eth: '0.2800' },
      gasFee: { tc: '8.00', eth: '0.0027' },
      total: { tc: '7568.00', eth: '2.5227' },
    })
  })

  it('aponta o item sem tiragem suficiente', async () => {
    const cart = await addToCart(ESPADA, 3, asGuest())
    changeNft(db.nfts.find((n) => n.id === ESPADA.nftId)!, (nft) => (nft.editions[0]!.available = 1))

    const error = await failure(quote('ooo', asGuest()))
    expect(error).toMatchObject({ status: 409, code: 'EDITION_LIMIT' })
    expect(Object.keys(error.fields ?? {})).toEqual([cart.items[0]!.id])
  })
})

describe('Pedido', () => {
  it('cria pendente, confirma no bloco e tira do carrinho só o que foi comprado', async () => {
    const body = await readyToBuy(2)
    await addToCart({ nftId: 'chapeu-do-jeff', editionId: 'classica' }, 1)
    // A cotação precisa refletir o carrinho atual.
    const current = await quote()
    const pending = await order({ ...body, quoteId: current.id })

    expect(pending).toMatchObject({ status: 'pending', txHash: null, total: current.total })
    expect(db.nfts.find((n) => n.id === ESPADA.nftId)!.editions[0]!.available).toBe(10)

    afterMining()
    const confirmed = orderSchema.parse((await http.get(`/orders/${pending.id}`)).data)
    expect(confirmed).toMatchObject({ status: 'confirmed', version: 2 })
    expect(confirmed.txHash).toMatch(/^0x[0-9a-f]{64}$/)

    const cart = cartSchema.parse((await http.get('/cart')).data)
    expect(cart.items).toEqual([])
  })

  it('mantém no carrinho o que foi adicionado depois da cotação', async () => {
    const body = await readyToBuy(1)
    const pending = await order(body)
    await addToCart(ESPADA, 1)

    afterMining()
    await http.get(`/orders/${pending.id}`)
    const cart = cartSchema.parse((await http.get('/cart')).data)
    expect(cart.items).toMatchObject([{ ...ESPADA, quantity: 1 }])
  })

  it('devolve o mesmo pedido para a mesma Idempotency-Key e conflito com outro conteúdo', async () => {
    const body = await readyToBuy()
    const first = await order(body)
    const retry = await order(body)

    expect(retry.id).toBe(first.id)
    expect(db.orders).toHaveLength(1)
    expect(await failure(order({ ...body, collector: { ...COLLECTOR, name: 'Jake' } }))).toMatchObject({
      status: 409,
      code: 'IDEMPOTENCY_CONFLICT',
    })
  })

  it('exige nova confirmação quando o preço muda depois da cotação', async () => {
    const body = await readyToBuy()
    changeNft(db.nfts.find((n) => n.id === ESPADA.nftId)!, (nft) => (nft.price = { tc: '4620.00', eth: '1.5400' }))

    expect(await failure(order(body))).toMatchObject({ status: 409, code: 'QUOTE_CHANGED' })
    expect(db.orders).toHaveLength(0)
  })

  it('exige carteira conectada na rede do pedido', async () => {
    const body = await readyToBuy()
    expect(await failure(order({ ...body, network: 'park' }))).toMatchObject({ code: 'QUOTE_CHANGED' })

    await http.delete('/wallets/wallet-finn-1/connect')
    expect(await failure(order(body))).toMatchObject({ status: 409, code: 'WALLET_DISCONNECTED' })
  })

  it('preserva o recibo quando o catálogo muda depois', async () => {
    const pending = await order(await readyToBuy(1))
    changeNft(db.nfts.find((n) => n.id === ESPADA.nftId)!, (nft) => (nft.price = { tc: '1.00', eth: '0.0001' }))

    afterMining()
    const receipt = orderSchema.parse((await http.get(`/orders/${pending.id}`)).data)
    expect(receipt.items[0]!.unitPrice).toEqual({ tc: '4200.00', eth: '1.4000' })
    expect(receipt.total).toEqual(pending.total)
  })

  it('não mostra o pedido para outro colecionador', async () => {
    const pending = await order(await readyToBuy())
    await login(GUMBALL)

    expect(await failure(http.get(`/orders/${pending.id}`))).toMatchObject({ status: 403, code: 'FORBIDDEN' })
    expect((await http.get('/orders')).data).toEqual({ items: [] })
  })

  it('no cenário tx-rejected recusa, devolve a tiragem e preserva o carrinho', async () => {
    setScenario('tx-rejected')
    const pending = await order(await readyToBuy(2))

    afterMining()
    const rejected = orderSchema.parse((await http.get(`/orders/${pending.id}`)).data)
    expect(rejected).toMatchObject({ status: 'rejected', txHash: null })
    expect(rejected.reason).toBeTruthy()
    expect(db.nfts.find((n) => n.id === ESPADA.nftId)!.editions[0]!.available).toBe(12)
    expect(cartSchema.parse((await http.get('/cart')).data).items).toMatchObject([{ quantity: 2 }])
  })

  it('no cenário wallet-rejected a carteira recusa a conexão', async () => {
    setScenario('wallet-rejected')
    await login()

    expect(await failure(http.post('/wallets/wallet-finn-1/connect', { network: 'ooo' }))).toMatchObject({
      status: 409,
      code: 'WALLET_REJECTED',
    })
  })
})
