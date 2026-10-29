import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { LoginRequest, RegisterRequest, Session, SessionInfo, User } from '@/contracts'
import type { ApiError } from '@/lib/http'
import { login, logout, register } from './api'
import { authKeys, endSession, restoreSession, startSession } from './session'

// A sessão só muda por login, cadastro, logout ou 401 (handleSessionExpiry): nunca fica velha nem sai
// do cache. Sem retry: em falha transitória `restoreSession` já devolve o usuário salvo, sem segurar o boot.
export function sessionQuery() {
  return queryOptions({
    queryKey: authKeys.session(),
    queryFn: ({ signal }) => restoreSession(signal),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  })
}

const selectUser = (session: SessionInfo | null) => session?.user ?? null

// Síncrono: o `beforeLoad` da raiz garante a sessão no cache antes de qualquer tela renderizar.
export function useCurrentUser(): User | null {
  const { data } = useQuery({ ...sessionQuery(), select: selectUser })
  return data ?? null
}

// A navegação depois do login/cadastro é do componente.
export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation<Session, ApiError, LoginRequest>({
    mutationFn: login,
    onSuccess: (session) => startSession(queryClient, session),
  })
}

// 409 EMAIL_TAKEN chega como ApiError com `fields.email`.
export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation<Session, ApiError, RegisterRequest>({
    mutationFn: register,
    onSuccess: (session) => startSession(queryClient, session),
  })
}

// Sempre sai: falha no POST /auth/logout é ignorada e a sessão local é limpa de qualquer jeito.
export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, void>({
    mutationFn: () => logout().catch(() => undefined),
    onSettled: () => endSession(queryClient),
  })
}
