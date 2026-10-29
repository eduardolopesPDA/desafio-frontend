import type { QueryClient } from '@tanstack/react-query'
import type { RegisteredRouter } from '@tanstack/react-router'
import { sessionSchema, type Session, type SessionInfo } from '@/contracts'
import { ApiError, onUnauthorized, setAccessToken } from '@/lib/http'
import { fetchSession } from './api'

// Lógica de sessão sem React: armazenamento, início/fim e expiração (ARCHITECTURE.md §7).

const STORAGE_KEY = 'cn-toon-vault:session'

// Fora de ['user']: a sessão sobrevive ao `removeQueries` dos dados privados.
export const authKeys = {
  session: () => ['auth', 'session'] as const,
}

// Guarda a sessão inteira (token + usuário): o usuário salvo segura a UI quando a validação falha por rede.
export function readStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? sessionSchema.safeParse(JSON.parse(raw)) : null
    if (parsed?.success) return parsed.data
  } catch {
    // Storage bloqueado ou JSON corrompido: cai para visitante.
  }
  return null
}

function writeStoredSession(session: Session | null) {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Sem storage a sessão vale só até o refresh.
  }
}

function setSessionData(queryClient: QueryClient, info: SessionInfo | null) {
  queryClient.setQueryData(authKeys.session(), info)
}

function hasExpired(expiresAt: string) {
  return Date.parse(expiresAt) <= Date.now()
}

// queryFn da sessão. Sem token salvo: visitante, sem requisição. 401: o token não vale mais e é
// descartado. Outras falhas (rede, timeout, 5xx, resposta fora do contrato) não deslogam: a UI segue
// com o usuário salvo, e se o token tiver mesmo caído o próximo 401 de outra requisição encerra a sessão.
export async function restoreSession(signal?: AbortSignal): Promise<SessionInfo | null> {
  const stored = readStoredSession()
  setAccessToken(stored?.token ?? null)
  if (!stored) return null

  try {
    const info = await fetchSession(signal)
    writeStoredSession({ ...info, token: stored.token })
    return info
  } catch (error) {
    if (signal?.aborted) throw error
    const rejected = error instanceof ApiError && error.status === 401
    if (rejected || hasExpired(stored.expiresAt)) {
      writeStoredSession(null)
      setAccessToken(null)
      return null
    }
    return { user: stored.user, expiresAt: stored.expiresAt }
  }
}

// Login e cadastro. Remove os dados privados de quem estava antes (troca de usuário sem logout).
export function startSession(queryClient: QueryClient, session: Session) {
  writeStoredSession(session)
  setAccessToken(session.token)
  setSessionData(queryClient, { user: session.user, expiresAt: session.expiresAt })
  queryClient.removeQueries({ queryKey: ['user'] })
}

// Logout e expiração.
export function endSession(queryClient: QueryClient) {
  writeStoredSession(null)
  setAccessToken(null)
  setSessionData(queryClient, null)
  queryClient.removeQueries({ queryKey: ['user'] })
  // Fase 4: desconectar o socket da sessão aqui (lib/realtime), para nenhum evento privado chegar depois.
}

// 401 de uma requisição que levou o token atual: encerra a sessão e manda para o login, guardando
// onde o usuário estava. `lib/http` só avisa uma vez por sessão (o primeiro aviso limpa o token, e os
// 401 seguintes já não batem com ele). Se a tela já é /login, não navega: o `redirect` não vira /login.
export function handleSessionExpiry({ router, queryClient }: { router: RegisteredRouter; queryClient: QueryClient }) {
  return onUnauthorized(() => {
    endSession(queryClient)
    const { location } = router.state
    if (location.pathname === '/login') return
    void router.navigate({ to: '/login', search: { redirect: location.href, reason: 'expired' } })
  })
}
