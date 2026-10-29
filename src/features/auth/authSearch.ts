import { z } from 'zod'

// Só caminhos internos: "//site" e "/\site" o navegador lê como outro domínio (open redirect).
const internalPath = z
  .string()
  .refine((value) => value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\'))

// `?redirect=` de /login e /register. Valor inválido é ignorado em vez de quebrar a página.
export const redirectSearchSchema = z.object({
  redirect: internalPath.optional().catch(undefined),
})

export const loginSearchSchema = redirectSearchSchema.extend({
  reason: z.literal('expired').optional().catch(undefined),
})
