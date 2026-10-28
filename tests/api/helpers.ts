import { expect } from 'vitest'
import { GUEST_CART_HEADER, sessionSchema } from '@/contracts'
import { ApiError, http, setAccessToken } from '@/lib/http'

export const FINN = { email: 'finchin@ooo.com', password: 'Finn1234' }
export const GUMBALL = { email: 'gumball@elmore.com', password: 'Gumball1234' }

export async function login(credentials = FINN) {
  const session = sessionSchema.parse((await http.post('/auth/login', credentials)).data)
  setAccessToken(session.token)
  return session
}

export const asGuest = (guestId = 'guest-1') => ({ headers: { [GUEST_CART_HEADER]: guestId } })

// Espera a falha e devolve o ApiError normalizado pelo cliente.
export async function failure(request: Promise<unknown>) {
  const error = await request.then(
    () => undefined,
    (e: unknown) => e,
  )
  expect(error).toBeInstanceOf(ApiError)
  return error as ApiError
}
