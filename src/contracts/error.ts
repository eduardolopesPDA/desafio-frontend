import { z } from 'zod'

// Códigos que a API devolve (docs/contracts.md › Erros).
export const apiErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'INVALID_CREDENTIALS',
  'SESSION_EXPIRED',
  'FORBIDDEN',
  'NFT_NOT_FOUND',
  'NOT_FOUND',
  'EMAIL_TAKEN',
  'SOLD_OUT',
  'EDITION_LIMIT',
  'QUOTE_CHANGED',
  'IDEMPOTENCY_CONFLICT',
  'WALLET_REJECTED',
  'WALLET_DISCONNECTED',
  'NFT_BURNED',
  'COUPON_INVALID',
  'COUPON_EXPIRED',
  'NETWORK_UNAVAILABLE',
  'INTERNAL_ERROR',
])
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>

export const apiErrorBodySchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
    fields: z.record(z.string(), z.string()).optional(),
  }),
})
export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>
