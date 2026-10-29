import { sessionInfoSchema, sessionSchema, type LoginRequest, type RegisterRequest } from '@/contracts'
import { http } from '@/lib/http'

// O corpo já vem validado pelo formulário (mesmos schemas) e a API revalida: erro de campo chega como
// ApiError VALIDATION_ERROR com `fields`, nunca como exceção do zod no cliente.
export async function register(body: RegisterRequest) {
  const { data } = await http.post('/auth/register', body)
  return sessionSchema.parse(data)
}

export async function login(body: LoginRequest) {
  const { data } = await http.post('/auth/login', body)
  return sessionSchema.parse(data)
}

// O 401 daqui é tratado por quem chama (sessão salva que já não vale), sem o redirect de expiração.
export async function fetchSession(signal?: AbortSignal) {
  const { data } = await http.get('/auth/session', { signal, skipUnauthorizedHandler: true })
  return sessionInfoSchema.parse(data)
}

// Sair nunca dispara o fluxo de expiração: a sessão vai ser limpa de qualquer jeito.
export async function logout() {
  await http.post('/auth/logout', undefined, { skipUnauthorizedHandler: true })
}
