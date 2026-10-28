import { describe, expect, it } from 'vitest'
import { featuredNftsResponseSchema, nftDetailSchema, nftListResponseSchema, type NftListParams } from '@/contracts'
import { http } from '@/lib/http'
import { setScenario } from '@/mocks/scenarios'
import { failure } from './helpers'

async function list(params: NftListParams = {}) {
  return nftListResponseSchema.parse((await http.get('/nfts', { params })).data)
}

describe('GET /nfts', () => {
  it('lista 12 por página, mais novos primeiro, sem NFTs queimados', async () => {
    const page = await list()

    expect(page).toMatchObject({ page: 1, pageSize: 12, total: 15 })
    expect(page.items).toHaveLength(12)
    expect(page.items[0]!.id).toBe('espada-de-sangue-de-demonio')
    expect(page.items.map((nft) => nft.id)).not.toContain('gema-do-lich')
  })

  it('combina filtros de show e raridade', async () => {
    const page = await list({ show: ['hora-de-aventura'], rarity: ['lendario', 'mitico'] })

    expect(page.items.map((nft) => nft.id)).toEqual(['espada-de-sangue-de-demonio', 'enchiridion'])
  })

  it('busca por nome do show ou do item, sem acento e sem caixa', async () => {
    expect((await list({ q: 'apenas um show' })).total).toBe(3)
    expect((await list({ q: 'carro de golfe' })).items[0]!.id).toBe('carro-de-golfe-do-parque')
    expect((await list({ q: 'clarencio' })).total).toBe(2)
  })

  it('devolve lista vazia quando nada combina', async () => {
    expect(await list({ q: 'Scooby-Doo' })).toMatchObject({ items: [], total: 0 })
  })

  it('ordena por preço e pagina', async () => {
    const cheapest = await list({ sort: 'price_asc', pageSize: 2 })
    const second = await list({ sort: 'price_asc', pageSize: 2, page: 2 })

    expect(cheapest.items.map((nft) => nft.price.tc)).toEqual(['150.00', '180.00'])
    expect(second.items.map((nft) => nft.price.tc)).toEqual(['220.00', '520.00'])
  })

  it('rejeita parâmetros fora do contrato', async () => {
    expect(await failure(http.get('/nfts', { params: { rarity: 'lendaria' } }))).toMatchObject({ status: 400, code: 'VALIDATION_ERROR' })
  })

  it('no cenário catalog-error falha 3 vezes e depois se recupera', async () => {
    setScenario('catalog-error')

    for (let attempt = 0; attempt < 3; attempt++) {
      expect(await failure(list())).toMatchObject({ status: 503, code: 'NETWORK_UNAVAILABLE', isTransient: true })
    }
    expect((await list()).total).toBe(15)
  })
})

describe('GET /nfts/featured', () => {
  it('traz os destaques da semana', async () => {
    const { items } = featuredNftsResponseSchema.parse((await http.get('/nfts/featured')).data)

    expect(items.map((nft) => nft.id).sort()).toEqual(['enchiridion', 'espada-de-sangue-de-demonio', 'fita-de-video-do-mordecai'])
  })
})

describe('GET /nfts/:id', () => {
  it('traz o detalhe com edições e disponibilidade somada', async () => {
    const nft = nftDetailSchema.parse((await http.get('/nfts/espada-de-sangue-de-demonio')).data)

    expect(nft.editions.map((e) => e.available)).toEqual([12, 3])
    expect(nft.available).toBe(15)
  })

  it('responde 404 para NFT inexistente e 410 para queimado', async () => {
    expect(await failure(http.get('/nfts/nao-existe'))).toMatchObject({ status: 404, code: 'NFT_NOT_FOUND' })
    expect(await failure(http.get('/nfts/gema-do-lich'))).toMatchObject({ status: 410, code: 'NFT_BURNED' })
  })
})
