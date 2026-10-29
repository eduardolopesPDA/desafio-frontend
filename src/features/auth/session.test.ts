import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, type AxiosAdapter, type AxiosResponse } from 'axios'
import { QueryClient } from '@tanstack/react-query'
import type { RegisteredRouter } from '@tanstack/react-router'
import type { Session } from '@/contracts'
import { ApiError, http } from '@/lib/http'
import { fetchSession } from './api'
import { authKeys, endSession, handleSessionExpiry, readStoredSession, restoreSession, startSession } from './session'

vi.mock('./api', () => ({ fetchSession: vi.fn() }))

const STORAGE_KEY = 'cn-toon-vault:session'
const user = { id: 'user-1', name: 'Finn', email: 'finn@ooo.com', avatar: 'finn', createdAt: '2026-01-01T00:00:00.000Z' } as const
const session: Session = { token: 'abc', user, expiresAt: new Date(Date.now() + 3_600_000).toISOString() }

function memoryStorage() {
  const items = new Map<string, string>()
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    removeItem: (key: string) => void items.delete(key),
  }
}

// Requisição real pelo Axios da app, com o header que o interceptor colocou.
async function requestAuthorization() {
  let header: unknown
  const adapter: AxiosAdapter = async (config) => {
    header = config.headers.Authorization
    return { status: 200, statusText: '', data: {}, headers: {}, config } satisfies AxiosResponse
  }
  await http.get('/x', { adapter })
  return header
}

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage())
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.mocked(fetchSession).mockReset()
})

describe('restoreSession', () => {
  it('sem token salvo é visitante, sem requisição', async () => {
    expect(await restoreSession()).toBeNull()
    expect(fetchSession).not.toHaveBeenCalled()
  })

  it('valida o token salvo e passa a enviá-lo', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    vi.mocked(fetchSession).mockResolvedValue({ user: { ...user, name: 'Finn, o Humano' }, expiresAt: session.expiresAt })

    expect(await restoreSession()).toMatchObject({ user: { name: 'Finn, o Humano' } })
    expect(await requestAuthorization()).toBe('Bearer abc')
    expect(readStoredSession()?.user.name).toBe('Finn, o Humano')
  })

  it('401 descarta o token salvo', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    vi.mocked(fetchSession).mockRejectedValue(new ApiError('SESSION_EXPIRED', 'Expirou', 401))

    expect(await restoreSession()).toBeNull()
    expect(readStoredSession()).toBeNull()
    expect(await requestAuthorization()).toBeUndefined()
  })

  it('falha transitória mantém o usuário salvo, sem deslogar', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    vi.mocked(fetchSession).mockRejectedValue(new ApiError('NETWORK_ERROR', 'Sem conexão'))

    expect(await restoreSession()).toEqual({ user, expiresAt: session.expiresAt })
    expect(readStoredSession()).toEqual(session)
    expect(await requestAuthorization()).toBe('Bearer abc')
  })

  it('falha transitória com a sessão salva já vencida vira visitante', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...session, expiresAt: '2020-01-01T00:00:00.000Z' }))
    vi.mocked(fetchSession).mockRejectedValue(new ApiError('INTERNAL_ERROR', 'Erro', 500))

    expect(await restoreSession()).toBeNull()
    expect(readStoredSession()).toBeNull()
  })
})

describe('startSession / endSession', () => {
  it('troca de usuário remove os dados privados e grava a sessão; o fim limpa tudo', async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(['user', 'outro', 'favorites'], ['enchiridion'])
    queryClient.setQueryData(['nfts', 'featured'], [])

    startSession(queryClient, session)
    expect(queryClient.getQueryData(['user', 'outro', 'favorites'])).toBeUndefined()
    expect(queryClient.getQueryData(['nfts', 'featured'])).toEqual([])
    expect(queryClient.getQueryData(authKeys.session())).toEqual({ user, expiresAt: session.expiresAt })
    expect(readStoredSession()).toEqual(session)
    expect(await requestAuthorization()).toBe('Bearer abc')

    queryClient.setQueryData(['user', user.id, 'favorites'], [])
    endSession(queryClient)
    expect(queryClient.getQueryData(['user', user.id, 'favorites'])).toBeUndefined()
    expect(queryClient.getQueryData(authKeys.session())).toBeNull()
    expect(readStoredSession()).toBeNull()
    expect(await requestAuthorization()).toBeUndefined()
  })
})

describe('handleSessionExpiry', () => {
  const expired = { error: { code: 'SESSION_EXPIRED', message: 'Sua sessão expirou.' } }
  const reply401: AxiosAdapter = async (config) => {
    const response: AxiosResponse = { status: 401, statusText: '', data: expired, headers: {}, config }
    throw new AxiosError('falha', AxiosError.ERR_BAD_REQUEST, config, {}, response)
  }

  function setup(href: string) {
    const navigate = vi.fn()
    const pathname = href.split('?')[0]
    const router = { state: { location: { href, pathname } }, navigate } as unknown as RegisteredRouter
    const queryClient = new QueryClient()
    startSession(queryClient, session)
    const remove = handleSessionExpiry({ router, queryClient })
    return { navigate, queryClient, remove }
  }

  it('várias requisições expirando juntas: limpa a sessão e vai ao login uma vez, guardando a rota', async () => {
    const { navigate, queryClient, remove } = setup('/checkout?step=2')

    await Promise.allSettled([http.get('/a', { adapter: reply401 }), http.get('/b', { adapter: reply401 })])

    expect(navigate).toHaveBeenCalledOnce()
    expect(navigate).toHaveBeenCalledWith({ to: '/login', search: { redirect: '/checkout?step=2', reason: 'expired' } })
    expect(queryClient.getQueryData(authKeys.session())).toBeNull()
    expect(readStoredSession()).toBeNull()
    remove()
  })

  it('já em /login, limpa a sessão sem navegar (o redirect não vira /login)', async () => {
    const { navigate, queryClient, remove } = setup('/login?redirect=%2Fprofile')

    await http.get('/a', { adapter: reply401 }).catch(() => {})

    expect(navigate).not.toHaveBeenCalled()
    expect(queryClient.getQueryData(authKeys.session())).toBeNull()
    remove()
  })
})
