import { z } from 'zod'
import { moneySchema } from './common'
import { orderStatusSchema } from './order'

export const SOCKET_EVENTS = { nftUpdated: 'nft.updated', orderUpdated: 'order.updated' } as const

// Todo evento tem identidade (`eventId`) e versão do recurso, para dedupe e descarte de antigos.
export const nftUpdatedEventSchema = z.object({
  eventId: z.string(),
  nftId: z.string(),
  version: z.int().min(1),
  price: moneySchema,
  available: z.int().min(0),
  editions: z.array(z.object({ id: z.string(), available: z.int().min(0) })),
})
export type NftUpdatedEvent = z.infer<typeof nftUpdatedEventSchema>

export const orderUpdatedEventSchema = z.object({
  eventId: z.string(),
  orderId: z.string(),
  version: z.int().min(1),
  status: orderStatusSchema,
  reason: z.string().nullable(),
})
export type OrderUpdatedEvent = z.infer<typeof orderUpdatedEventSchema>
