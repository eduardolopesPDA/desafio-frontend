import { featuredNftsResponseSchema, nftListResponseSchema, type NftListParams } from '@/contracts'
import { http } from '@/lib/http'

export async function fetchNfts(params: NftListParams, signal?: AbortSignal) {
  const { data } = await http.get('/nfts', { params, signal })
  return nftListResponseSchema.parse(data)
}

export async function fetchFeaturedNfts(signal?: AbortSignal) {
  const { data } = await http.get('/nfts/featured', { signal })
  return featuredNftsResponseSchema.parse(data).items
}
