import { nftDetailSchema } from '@/contracts'
import { http } from '@/lib/http'

export async function fetchNft(id: string, signal?: AbortSignal) {
  const { data } = await http.get(`/nfts/${encodeURIComponent(id)}`, { signal })
  return nftDetailSchema.parse(data)
}
