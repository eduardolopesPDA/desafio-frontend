import { z } from 'zod'
import { dateTimeSchema, moneySchema, networkIdSchema } from './common'
import { emailSchema, nameSchema } from './auth'
import { couponSchema } from './cart'
import { quoteItemSchema } from './quote'

export const orderStatusSchema = z.enum(['pending', 'confirmed', 'rejected'])
export type OrderStatus = z.infer<typeof orderStatusSchema>

export const collectorSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  // Nome que vai no autógrafo do card.
  autographName: z.string().trim().max(40, 'Máximo de 40 caracteres').optional(),
})
export type Collector = z.infer<typeof collectorSchema>

// Header `Idempotency-Key` obrigatório.
export const createOrderRequestSchema = z.object({
  quoteId: z.string().min(1),
  walletId: z.string().min(1),
  network: networkIdSchema,
  collector: collectorSchema,
})
export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>

// Snapshot: não muda quando o catálogo muda.
export const orderItemSchema = quoteItemSchema.omit({ itemId: true })
export type OrderItem = z.infer<typeof orderItemSchema>

export const orderSchema = z.object({
  id: z.string(),
  status: orderStatusSchema,
  version: z.int().min(1),
  network: networkIdSchema,
  wallet: z.object({ id: z.string(), label: z.string(), address: z.string() }),
  collector: collectorSchema,
  items: z.array(orderItemSchema).min(1),
  coupon: couponSchema.nullable(),
  subtotal: moneySchema,
  discount: moneySchema,
  gasFee: moneySchema,
  total: moneySchema,
  txHash: z.string().nullable(),
  blockNumber: z.int().nullable(),
  explorerUrl: z.string().nullable(),
  reason: z.string().nullable(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
})
export type Order = z.infer<typeof orderSchema>

export const ordersResponseSchema = z.object({ items: z.array(orderSchema) })
