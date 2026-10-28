import { HttpResponse } from 'msw'
import { loginRequestSchema, registerRequestSchema, type SessionInfo } from '@/contracts'
import { db, nextId } from '../db'
import { MockError, noContent, parseBody, route } from '../http'
import { checkPassword, endSession, hashPassword, requireSession, startSession, toUser } from '../session'

export const authHandlers = [
  route('post', '/auth/register', async ({ request }) => {
    const body = await parseBody(request, registerRequestSchema)
    if (db.users.some((u) => u.email === body.email)) {
      throw new MockError(409, 'EMAIL_TAKEN', 'Este e-mail já tem um Toon Pass.', { email: 'E-mail já cadastrado' })
    }
    const salt = crypto.randomUUID()
    const user = {
      id: nextId('user'),
      name: body.name,
      email: body.email,
      avatar: body.avatar,
      createdAt: new Date().toISOString(),
      salt,
      passwordHash: await hashPassword(salt, body.password),
    }
    db.users.push(user)
    return HttpResponse.json(startSession(user), { status: 201 })
  }),

  route('post', '/auth/login', async ({ request }) => {
    const body = await parseBody(request, loginRequestSchema)
    const user = db.users.find((u) => u.email === body.email)
    if (!user || !(await checkPassword(user, body.password))) {
      throw new MockError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.')
    }
    return HttpResponse.json(startSession(user))
  }),

  route('get', '/auth/session', ({ request }) => {
    const { user, session } = requireSession(request)
    return HttpResponse.json<SessionInfo>({ user: toUser(user), expiresAt: session.expiresAt })
  }),

  route('post', '/auth/logout', ({ request }) => {
    endSession(request)
    return noContent()
  }),
]
