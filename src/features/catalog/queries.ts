import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import type { NftListParams } from '@/contracts'
import { fetchFeaturedNfts, fetchNfts } from './api'

// Tudo de NFT começa com 'nfts': o tempo real (Fase 4) invalida ou atualiza por esse prefixo.
export const catalogKeys = {
  all: ['nfts'] as const,
  list: (params: NftListParams) => ['nfts', 'list', params] as const,
  featured: () => ['nfts', 'featured'] as const,
}

export const catalogQueries = {
  // Cada combinação de parâmetros tem sua key: resposta atrasada de outra busca não aparece.
  list: (params: NftListParams) =>
    queryOptions({
      queryKey: catalogKeys.list(params),
      queryFn: ({ signal }) => fetchNfts(params, signal),
      placeholderData: keepPreviousData,
    }),
  featured: () =>
    queryOptions({
      queryKey: catalogKeys.featured(),
      queryFn: ({ signal }) => fetchFeaturedNfts(signal),
    }),
}
