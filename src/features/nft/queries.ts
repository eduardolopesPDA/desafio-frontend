import { queryOptions } from '@tanstack/react-query'
import { fetchNft } from './api'

export const nftKeys = {
  detail: (id: string) => ['nfts', 'detail', id] as const,
}

export const nftQueries = {
  detail: (id: string) =>
    queryOptions({
      queryKey: nftKeys.detail(id),
      queryFn: ({ signal }) => fetchNft(id, signal),
    }),
}
