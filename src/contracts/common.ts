import { z } from 'zod'

export const GUEST_CART_HEADER = 'X-Guest-Cart-Id'
export const IDEMPOTENCY_HEADER = 'Idempotency-Key'

// Dinheiro trafega como string decimal (ARCHITECTURE.md §6).
export const decimalStringSchema = z.string().regex(/^-?\d+(\.\d+)?$/, 'Valor decimal inválido')

export const moneySchema = z.object({ tc: decimalStringSchema, eth: decimalStringSchema })
export type Money = z.infer<typeof moneySchema>

export const dateTimeSchema = z.iso.datetime()

export const imageSchema = z.object({ src: z.string(), alt: z.string() })
export type Image = z.infer<typeof imageSchema>

export function paginatedSchema<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    page: z.int().min(1),
    pageSize: z.int().min(1),
    total: z.int().min(0),
  })
}

export const networkIdSchema = z.enum(['ooo', 'elmore', 'park'])
export type NetworkId = z.infer<typeof networkIdSchema>
export const NETWORK_NAMES: Record<NetworkId, string> = {
  ooo: 'Ooo Network',
  elmore: 'Elmore Net',
  park: 'Park Grid',
}
