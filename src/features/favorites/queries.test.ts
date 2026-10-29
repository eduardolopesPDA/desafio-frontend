import { afterEach, describe, expect, it, vi } from 'vitest'
import { MutationObserver, QueryClient } from '@tanstack/react-query'
import type { SessionInfo } from '@/contracts'
import { ApiError } from '@/lib/http'
import { sessionQuery } from '@/features/auth/queries'
import { addFavorite, removeFavorite } from './api'
import { favoriteKeys, toggleFavoriteOptions, type ToggleFavoriteVariables } from './queries'

vi.mock('./api', () => ({ addFavorite: vi.fn(), removeFavorite: vi.fn(), fetchFavoriteIds: vi.fn() }))

const USER = 'user-1'
const KEY = favoriteKeys.list(USER)

// Cada chamada à API fica pendente até o teste decidir se dá certo ou falha.
function controlledApi() {
  const calls: Array<{ method: 'PUT' | 'DELETE'; nftId: string; ok: () => void; fail: () => void }> = []
  const track = (method: 'PUT' | 'DELETE') => (nftId: string) =>
    new Promise<void>((resolve, reject) => {
      calls.push({ method, nftId, ok: resolve, fail: () => reject(new ApiError('NETWORK_UNAVAILABLE', 'Instável', 503)) })
    })
  vi.mocked(addFavorite).mockImplementation(track('PUT'))
  vi.mocked(removeFavorite).mockImplementation(track('DELETE'))
  return calls
}

function setup(initial: string[]) {
  const queryClient = new QueryClient()
  const session: SessionInfo = {
    user: { id: USER, name: 'Finn', email: 'finchin@ooo.com', avatar: 'finn', createdAt: '2026-01-01T00:00:00.000Z' },
    expiresAt: '2099-01-01T00:00:00.000Z',
  }
  queryClient.setQueryData(sessionQuery().queryKey, session)
  queryClient.setQueryData(KEY, initial)
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  const options = toggleFavoriteOptions(queryClient, USER)
  // Um observer por clique, como botões diferentes do mesmo NFT (cartão e detalhe).
  const click = (variables: ToggleFavoriteVariables) => new MutationObserver(queryClient, options).mutate(variables).catch(() => {})
  return { queryClient, invalidate, click, ids: () => queryClient.getQueryData<string[]>(KEY) }
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

afterEach(() => vi.resetAllMocks())

describe('toggle de Toon Star', () => {
  it('é otimista e faz rollback numa falha', async () => {
    const calls = controlledApi()
    const { click, ids, invalidate } = setup([])

    const done = click({ nftId: 'a', favorite: true })
    await vi.waitFor(() => expect(calls).toHaveLength(1))
    expect(ids()).toEqual(['a'])

    calls[0]!.fail()
    await done
    expect(ids()).toEqual([])
    expect(invalidate).toHaveBeenCalledOnce()
  })

  it('envia os cliques em sequência, na ordem em que aconteceram', async () => {
    const calls = controlledApi()
    const { click, ids } = setup([])

    const first = click({ nftId: 'a', favorite: true })
    const second = click({ nftId: 'a', favorite: false })
    await vi.waitFor(() => expect(calls).toHaveLength(1))
    expect(ids()).toEqual([]) // o otimismo já mostra o último clique
    await settle()
    expect(calls).toHaveLength(1) // o DELETE espera o PUT terminar

    calls[0]!.ok()
    await vi.waitFor(() => expect(calls).toHaveLength(2))
    expect(calls.map((c) => c.method)).toEqual(['PUT', 'DELETE'])
    calls[1]!.ok()
    await Promise.all([first, second])
    expect(ids()).toEqual([])
  })

  // Estado inicial sem estrela; clique 1 marca (PUT), clique 2 desmarca (DELETE).
  it.each([
    { put: 'ok', del: 'falha', esperado: ['a'] }, // servidor ficou com o PUT
    { put: 'falha', del: 'ok', esperado: [] }, // servidor ficou com o DELETE
    { put: 'falha', del: 'falha', esperado: [] }, // nada mudou no servidor
  ] as const)('cliques rápidos: PUT $put e DELETE $del terminam em $esperado', async ({ put, del, esperado }) => {
    const calls = controlledApi()
    const { click, ids, invalidate } = setup([])

    const first = click({ nftId: 'a', favorite: true })
    const second = click({ nftId: 'a', favorite: false })

    await vi.waitFor(() => expect(calls).toHaveLength(1))
    calls[0]![put === 'ok' ? 'ok' : 'fail']()
    await vi.waitFor(() => expect(calls).toHaveLength(2))
    expect(ids()).toEqual([]) // a falha do primeiro não desfaz o otimismo do segundo
    expect(invalidate).not.toHaveBeenCalled() // refetch no meio faria a estrela piscar

    calls[1]![del === 'ok' ? 'ok' : 'fail']()
    await Promise.all([first, second])
    expect(ids()).toEqual(esperado)
    expect(invalidate).toHaveBeenCalledOnce()
  })

  it('não recria o cache privado se a sessão acabou no meio', async () => {
    const calls = controlledApi()
    const { click, queryClient } = setup(['b'])

    const done = click({ nftId: 'a', favorite: true })
    await vi.waitFor(() => expect(calls).toHaveLength(1))
    queryClient.removeQueries({ queryKey: ['user'] })
    calls[0]!.fail()
    await done

    expect(queryClient.getQueryCache().find({ queryKey: KEY })).toBeUndefined()
  })

  it('não envia um toggle da fila depois que a sessão trocou de usuário', async () => {
    const calls = controlledApi()
    const { click, queryClient } = setup([])

    const first = click({ nftId: 'a', favorite: true })
    const second = click({ nftId: 'b', favorite: true })
    await vi.waitFor(() => expect(calls).toHaveLength(1))
    // Logout seguido de login de outro colecionador enquanto o segundo clique espera na fila.
    queryClient.setQueryData(sessionQuery().queryKey, null)
    calls[0]!.ok()
    await Promise.all([first, second])

    expect(calls.map((c) => c.nftId)).toEqual(['a'])
  })
})
