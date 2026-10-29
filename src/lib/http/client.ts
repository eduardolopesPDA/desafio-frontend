import axios, { isAxiosError } from 'axios'
import { ApiError, toApiError } from './errors'

const REQUEST_TIMEOUT_MS = 10_000

declare module 'axios' {
  interface AxiosRequestConfig {
    // A requisição trata o próprio 401 e não avisa o handler de `onUnauthorized` (ex.: GET /auth/session).
    skipUnauthorizedHandler?: boolean
  }
}

let accessToken: string | null = null

// Quem guarda e recupera a sessão é a feature auth; aqui só fica o token da requisição.
export function setAccessToken(token: string | null) {
  accessToken = token
}

type UnauthorizedHandler = (error: ApiError) => void
let unauthorizedHandler: UnauthorizedHandler | null = null

// Avisa quando a sessão atual deixa de valer (401 SESSION_EXPIRED ou UNAUTHENTICATED). Um handler por vez;
// devolve a função que o remove. O erro continua sendo rejeitado para quem fez a requisição.
export function onUnauthorized(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler
  return () => {
    if (unauthorizedHandler === handler) unauthorizedHandler = null
  }
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: REQUEST_TIMEOUT_MS,
  // Listas repetem a chave (?rarity=raro&rarity=epico), como no contrato.
  paramsSerializer: { indexes: null },
})

http.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

// Só conta o 401 de uma requisição que levou o token *atual*. Assim, respostas atrasadas de uma
// sessão que já acabou (logout, troca de usuário) são ignoradas, e quando várias requisições expiram
// juntas o handler roda uma vez só: ele limpa o token, e as respostas seguintes já não batem.
function endsCurrentSession(error: unknown, apiError: ApiError) {
  if (apiError.code !== 'SESSION_EXPIRED' && apiError.code !== 'UNAUTHENTICATED') return false
  if (!accessToken || !isAxiosError(error) || error.config?.skipUnauthorizedHandler) return false
  return error.config?.headers.Authorization === `Bearer ${accessToken}`
}

// Toda falha chega às features como ApiError. Cancelamentos seguem intactos para o TanStack Query.
http.interceptors.response.use(undefined, (error: unknown) => {
  if (axios.isCancel(error)) return Promise.reject(error)
  const apiError = toApiError(error)
  if (endsCurrentSession(error, apiError)) unauthorizedHandler?.(apiError)
  return Promise.reject(apiError)
})
