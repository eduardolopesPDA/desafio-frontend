import axios from 'axios'
import { toApiError } from './errors'

const REQUEST_TIMEOUT_MS = 10_000

let accessToken: string | null = null

// Quem guarda e recupera a sessão é a feature auth; aqui só fica o token da requisição.
export function setAccessToken(token: string | null) {
  accessToken = token
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: REQUEST_TIMEOUT_MS,
})

http.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

// Toda falha chega às features como ApiError. Cancelamentos seguem intactos para o TanStack Query.
http.interceptors.response.use(undefined, (error: unknown) =>
  Promise.reject(axios.isCancel(error) ? error : toApiError(error)),
)
