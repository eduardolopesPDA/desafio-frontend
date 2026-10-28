import type { Session, User } from '@/contracts'
import { db, type SessionRecord, type UserRecord } from './db'
import { MockError } from './http'

const SESSION_TTL_MS = 24 * 60 * 60 * 1000

function bearerToken(request: Request) {
  const header = request.headers.get('Authorization')
  return header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null
}

type SessionLookup = { user: UserRecord; session: SessionRecord } | { error: 'UNAUTHENTICATED' | 'SESSION_EXPIRED' }

export function findSessionUser(token: string): SessionLookup {
  const session = db.sessions.find((s) => s.token === token)
  if (!session) return { error: 'UNAUTHENTICATED' }
  if (Date.parse(session.expiresAt) <= Date.now()) return { error: 'SESSION_EXPIRED' }
  const user = db.users.find((u) => u.id === session.userId)
  return user ? { user, session } : { error: 'UNAUTHENTICATED' }
}

// Sem token: visitante (null). Token inválido ou expirado: 401, mesmo em rota pública.
export function currentSession(request: Request): { user: UserRecord; session: SessionRecord } | null {
  const token = bearerToken(request)
  if (!token) return null
  const result = findSessionUser(token)
  if ('user' in result) return result
  if (result.error === 'SESSION_EXPIRED') throw new MockError(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.')
  throw new MockError(401, 'UNAUTHENTICATED', 'Sessão inválida. Entre novamente.')
}

export function currentUser(request: Request): UserRecord | null {
  return currentSession(request)?.user ?? null
}

export function requireSession(request: Request) {
  const current = currentSession(request)
  if (!current) throw new MockError(401, 'UNAUTHENTICATED', 'Entre com seu Toon Pass para continuar.')
  return current
}

export function requireUser(request: Request): UserRecord {
  return requireSession(request).user
}

export function endSession(request: Request) {
  const token = bearerToken(request)
  db.sessions = db.sessions.filter((s) => s.token !== token)
}

export function startSession(user: UserRecord): Session {
  const session = {
    token: crypto.randomUUID(),
    userId: user.id,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  }
  db.sessions.push(session)
  return { token: session.token, user: toUser(user), expiresAt: session.expiresAt }
}

export function toUser({ id, name, email, avatar, createdAt }: UserRecord): User {
  return { id, name, email, avatar, createdAt }
}

// SHA-256 de `${salt}:${senha}` via Web Crypto: a senha em claro nunca é guardada.
export async function hashPassword(salt: string, password: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${password}`))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function checkPassword(user: UserRecord, password: string) {
  return (await hashPassword(user.salt, password)) === user.passwordHash
}

export async function setPassword(user: UserRecord, password: string) {
  user.salt = crypto.randomUUID()
  user.passwordHash = await hashPassword(user.salt, password)
}
