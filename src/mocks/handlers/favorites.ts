import { HttpResponse } from 'msw'
import type { FavoritesResponse } from '@/contracts'
import { db } from '../db'
import { findActiveNft } from '../catalog'
import { noContent, route } from '../http'
import { requireUser } from '../session'

export const favoriteHandlers = [
  route('get', '/favorites', ({ request }) => {
    const user = requireUser(request)
    return HttpResponse.json<FavoritesResponse>({ nftIds: db.favorites[user.id] ?? [] })
  }),

  // PUT e DELETE são idempotentes: repetir não muda o resultado.
  route('put', '/favorites/:nftId', ({ request, params }) => {
    const user = requireUser(request)
    const nft = findActiveNft(params.nftId!)
    const favorites = (db.favorites[user.id] ??= [])
    if (!favorites.includes(nft.id)) favorites.push(nft.id)
    return noContent()
  }),

  route('delete', '/favorites/:nftId', ({ request, params }) => {
    const user = requireUser(request)
    db.favorites[user.id] = (db.favorites[user.id] ?? []).filter((id) => id !== params.nftId)
    return noContent()
  }),
]
