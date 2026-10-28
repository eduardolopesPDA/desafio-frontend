import { z } from 'zod'
import { dateTimeSchema, imageSchema, moneySchema, networkIdSchema } from './common'
import { couponSchema } from './cart'

export const quoteRequestSchema = z.object({ network: networkIdSchema })
export type QuoteRequest = z.infer<typeof quoteRequestSchema>

export const quoteItemSchema = z.object({
  itemId: z.string(),
  nftId: z.string(),
  editionId: z.string(),
  editionName: z.string(),
  name: z.string(),
  image: imageSchema,
  quantity: z.int().min(1),
  unitPrice: moneySchema,
  lineTotal: moneySchema,
})
export type QuoteItem = z.infer<typeof quoteItemSchema>

export const quoteSchema = z.object({
  id: z.string(),
  network: networkIdSchema,
  items: z.array(quoteItemSchema),
  coupon: couponSchema.nullable(),
  subtotal: moneySchema,
  discount: moneySchema,
  gasFee: moneySchema,
  total: moneySchema,
  createdAt: dateTimeSchema,
  expiresAt: dateTimeSchema,
})
export type Quote = z.infer<typeof quoteSchema>
