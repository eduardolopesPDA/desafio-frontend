import { z } from 'zod'

// Códigos que a API devolve (docs/contracts.md › Erros).
export const apiErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'SESSION_EXPIRED',
  'FORBIDDEN',
  'NFT_NOT_FOUND',
  'NOT_FOUND',
  'EMAIL_TAKEN',
  'SOLD_OUT',
  'EDITION_LIMIT',
  'QUOTE_CHANGED',
  'IDEMPOTENCY_CONFLICT',
  'NFT_BURNED',
  'COUPON_INVALID',
  'COUPON_EXPIRED',
  'NETWORK_UNAVAILABLE',
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
