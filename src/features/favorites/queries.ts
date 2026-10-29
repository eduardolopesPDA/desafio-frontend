import { queryOptions, useMutation, useQuery, useQueryClient, type QueryClient, type UseMutationOptions } from '@tanstack/react-query'
import { sessionQuery, useCurrentUser } from '@/features/auth/queries'
import { ApiError } from '@/lib/http'
import { addFavorite, fetchFavoriteIds, removeFavorite } from './api'

// Dados privados: prefixo ['user', userId] para o logout e a troca de usuário removerem.
export const favoriteKeys = {
  list: (userId: string) => ['user', userId, 'favorites'] as const,
}

export const favoriteQueries = {
  list: (userId: string) =>
    queryOptions({
      queryKey: favoriteKeys.list(userId),
      queryFn: ({ signal }) => fetchFavoriteIds(signal),
    }),
}

const NO_FAVORITES = new Set<string>()
const toSet = (ids: string[]) => new Set(ids)

// Visitante: conjunto vazio, sem requisição. Logado: `undefined` enquanto a lista não chega, porque
// sem ela não dá para saber se o clique deve marcar ou desmarcar.
export function useFavoriteIds(): Set<string> | undefined {
  const user = useCurrentUser()
  const { data } = useQuery({ ...favoriteQueries.list(user?.id ?? ''), enabled: user !== null, select: toSet })
  return user ? data : NO_FAVORITES
}

export type ToggleFavoriteVariables = { nftId: string; favorite: boolean }
type ToggleContext = { userId: string; track: string } | undefined

const TOGGLE_KEY = ['favorites', 'toggle'] as const

// Toggles em voo por usuário + NFT. `confirmed` é o último estado que o servidor aceitou (ou o do
// cache antes do primeiro clique da sequência); `pending`, quantos toggles desse NFT ainda não terminaram.
const inFlight = new Map<string, { confirmed: boolean | undefined; pending: number }>()

function withFavorite(ids: string[], nftId: string, favorite: boolean) {
  const others = ids.filter((id) => id !== nftId)
  return favorite ? [...others, nftId] : others
}

// Toon Star otimista (ARCHITECTURE.md §4). Cliques repetidos no mesmo NFT:
// - `scope` enfileira os toggles: as requisições saem na ordem dos cliques, então o servidor termina
//   no estado do último que deu certo (PUT/DELETE dizem o estado final, não "alternar").
// - O rollback não volta ao snapshot do clique, que pode ser o otimismo de um clique anterior que
//   também falhou. Só o último toggle pendente do NFT corrige o cache, e para `confirmed`.
// - A invalidação espera o último toggle terminar: um refetch no meio traria o estado de antes do
//   próximo PUT/DELETE e faria a estrela piscar.
export function toggleFavoriteOptions(
  queryClient: QueryClient,
  userId: string | null,
): UseMutationOptions<void, ApiError, ToggleFavoriteVariables, ToggleContext> {
  return {
    mutationKey: TOGGLE_KEY,
    scope: { id: `favorites:${userId}` },
    mutationFn: ({ nftId, favorite }) => {
      // Na fila do `scope`, o toggle pode sair depois de um logout ou troca de usuário; o token
      // seria o do próximo colecionador e a estrela iria para a conta dele.
      if (queryClient.getQueryData(sessionQuery().queryKey)?.user.id !== userId) {
        return Promise.reject(new ApiError('UNAUTHENTICATED', 'Sua sessão mudou. A Toon Star não foi salva.'))
      }
      return favorite ? addFavorite(nftId) : removeFavorite(nftId)
    },
    onMutate: async ({ nftId, favorite }) => {
      if (!userId) return undefined
      const { queryKey } = favoriteQueries.list(userId)
      await queryClient.cancelQueries({ queryKey })

      const track = `${userId}:${nftId}`
      const entry = inFlight.get(track) ?? { confirmed: queryClient.getQueryData(queryKey)?.includes(nftId), pending: 0 }
      entry.pending += 1
      inFlight.set(track, entry)
      // Sem lista no cache (ainda carregando) não há o que antecipar; o `onSettled` busca o estado real.
      queryClient.setQueryData(queryKey, (ids) => ids && withFavorite(ids, nftId, favorite))
      return { userId, track }
    },
    onSuccess: (_data, { favorite }, context) => {
      const entry = context && inFlight.get(context.track)
      if (entry) entry.confirmed = favorite
    },
    onError: (_error, { nftId }, context) => {
      const entry = context && inFlight.get(context.track)
      if (!context || !entry || entry.pending > 1 || entry.confirmed === undefined) return
      const confirmed = entry.confirmed
      // `ids &&`: se a sessão acabou no meio, o cache privado já foi removido e não deve renascer.
      queryClient.setQueryData(favoriteQueries.list(context.userId).queryKey, (ids) => ids && withFavorite(ids, nftId, confirmed))
    },
    onSettled: (_data, _error, _variables, context) => {
      if (!context) return
      const entry = inFlight.get(context.track)
      if (entry && --entry.pending === 0) inFlight.delete(context.track)
      // O toggle atual ainda conta como pendente aqui.
      if (queryClient.isMutating({ mutationKey: TOGGLE_KEY }) === 1) {
        void queryClient.invalidateQueries({ queryKey: favoriteKeys.list(context.userId) })
      }
    },
  }
}

// O erro fica em `error`/`isError` do próprio retorno; a mensagem para o usuário é da UI.
export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const userId = useCurrentUser()?.id ?? null
  return useMutation(toggleFavoriteOptions(queryClient, userId))
}
