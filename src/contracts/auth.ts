import { z } from 'zod'
import { dateTimeSchema } from './common'

export const avatarIdSchema = z.enum([
  'finn',
  'jake',
  'gumball',
  'darwin',
  'mordecai',
  'rigby',
  'clarencio',
  'lindinha',
  'dexter',
  'coragem',
])
export type AvatarId = z.infer<typeof avatarIdSchema>
export const AVATAR_NAMES: Record<AvatarId, string> = {
  finn: 'Finn',
  jake: 'Jake',
  gumball: 'Gumball',
  darwin: 'Darwin',
  mordecai: 'Mordecai',
  rigby: 'Rigby',
  clarencio: 'Clarêncio',
  lindinha: 'Lindinha',
  dexter: 'Dexter',
  coragem: 'Coragem',
}

export const nameSchema = z.string().trim().min(2, 'Mínimo de 2 caracteres').max(60, 'Máximo de 60 caracteres')
export const emailSchema = z.string().trim().toLowerCase().pipe(z.email('E-mail inválido'))
export const passwordSchema = z
  .string()
  .min(8, 'Mínimo de 8 caracteres')
  .regex(/[A-Za-z]/, 'Inclua ao menos uma letra')
  .regex(/\d/, 'Inclua ao menos um número')

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  avatar: avatarIdSchema,
  createdAt: dateTimeSchema,
})
export type User = z.infer<typeof userSchema>

export const registerRequestSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  avatar: avatarIdSchema,
})
export type RegisterRequest = z.infer<typeof registerRequestSchema>

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe a senha'),
})
export type LoginRequest = z.infer<typeof loginRequestSchema>

// Resposta de cadastro e login.
export const sessionSchema = z.object({ token: z.string(), user: userSchema, expiresAt: dateTimeSchema })
export type Session = z.infer<typeof sessionSchema>

// GET /auth/session: o token já está com o cliente.
export const sessionInfoSchema = sessionSchema.omit({ token: true })
export type SessionInfo = z.infer<typeof sessionInfoSchema>
