import { favoritesResponseSchema } from '@/contracts'
import { http } from '@/lib/http'

export async function fetchFavoriteIds(signal?: AbortSignal) {
  const { data } = await http.get('/favorites', { signal })
  return favoritesResponseSchema.parse(data).nftIds
}

// PUT e DELETE são idempotentes: o corpo diz o estado final, não "alternar".
export async function addFavorite(nftId: string) {
  await http.put(`/favorites/${encodeURIComponent(nftId)}`)
}

export async function removeFavorite(nftId: string) {
  await http.delete(`/favorites/${encodeURIComponent(nftId)}`)
}
