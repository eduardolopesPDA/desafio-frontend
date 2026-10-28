import { HttpResponse } from 'msw'
import { nftListParamsSchema, RARITY_NAMES, raritySchema, SHOW_NAMES, type NftListResponse, type NftSort } from '@/contracts'
import { db, type NftRecord } from '../db'
import { findActiveNft, toDetail, toSummary } from '../catalog'
import { MockError, route } from '../http'

// Busca sem acento e sem caixa: "clarencio" encontra "Clarêncio".
function normalize(text: string) {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

const rarityRank = (nft: NftRecord) => raritySchema.options.indexOf(nft.rarity)

const SORTERS: Record<NftSort, (a: NftRecord, b: NftRecord) => number> = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  price_asc: (a, b) => Number(a.price.tc) - Number(b.price.tc),
  price_desc: (a, b) => Number(b.price.tc) - Number(a.price.tc),
  rarity: (a, b) => rarityRank(b) - rarityRank(a),
}

export const nftHandlers = [
  route('get', '/nfts', ({ request }) => {
    const search = new URL(request.url).searchParams
    const parsed = nftListParamsSchema.safeParse({
      q: search.get('q') ?? undefined,
      rarity: search.getAll('rarity'),
      show: search.getAll('show'),
      sort: search.get('sort') ?? undefined,
      page: search.get('page') ?? undefined,
      pageSize: search.get('pageSize') ?? undefined,
    })
    if (!parsed.success) throw new MockError(400, 'VALIDATION_ERROR', 'Parâmetros de busca inválidos.')
    const { q, rarity, show, sort, page, pageSize } = parsed.data

    const term = q ? normalize(q) : ''
    const matches = db.nfts
      .filter((nft) => nft.status === 'active')
      .filter((nft) => !term || [nft.name, nft.character, SHOW_NAMES[nft.show], RARITY_NAMES[nft.rarity]].some((text) => normalize(text).includes(term)))
      .filter((nft) => !rarity?.length || rarity.includes(nft.rarity))
      .filter((nft) => !show?.length || show.includes(nft.show))
      // Desempate por nome: a mesma busca sempre devolve a mesma página.
      .sort((a, b) => SORTERS[sort](a, b) || a.name.localeCompare(b.name))

    const start = (page - 1) * pageSize
    return HttpResponse.json<NftListResponse>({
      items: matches.slice(start, start + pageSize).map(toSummary),
      page,
      pageSize,
      total: matches.length,
    })
  }),

  // Antes de /nfts/:id, senão "featured" vira um id.
  route('get', '/nfts/featured', () =>
    HttpResponse.json({ items: db.nfts.filter((nft) => nft.featured && nft.status === 'active').map(toSummary) }),
  ),

  route('get', '/nfts/:id', ({ params }) => HttpResponse.json(toDetail(findActiveNft(params.id!)))),
]
