import { z } from 'zod'
import { dateTimeSchema, imageSchema, moneySchema } from './common'

export const couponSchema = z.object({ code: z.string(), description: z.string() })
export type Coupon = z.infer<typeof couponSchema>

// Preço e disponibilidade vêm do catálogo no momento da leitura.
export const cartItemSchema = z.object({
  id: z.string(),
  nftId: z.string(),
  editionId: z.string(),
  editionName: z.string(),
  name: z.string(),
  image: imageSchema,
  quantity: z.int().min(1),
  unitPrice: moneySchema,
  available: z.int().min(0),
  maxPerOrder: z.int().min(1),
})
export type CartItem = z.infer<typeof cartItemSchema>

export const cartSchema = z.object({
  id: z.string(),
  items: z.array(cartItemSchema),
  coupon: couponSchema.nullable(),
  updatedAt: dateTimeSchema,
})
export type Cart = z.infer<typeof cartSchema>

const quantitySchema = z.int('Quantidade deve ser inteira').min(1, 'Quantidade mínima é 1')

export const addCartItemRequestSchema = z.object({
  nftId: z.string().min(1),
  editionId: z.string().min(1),
  quantity: quantitySchema,
})
export type AddCartItemRequest = z.infer<typeof addCartItemRequestSchema>

export const updateCartItemRequestSchema = z.object({ quantity: quantitySchema })
export type UpdateCartItemRequest = z.infer<typeof updateCartItemRequestSchema>

export const applyCouponRequestSchema = z.object({
  code: z.string().trim().min(1, 'Informe o cupom').toUpperCase(),
})
export type ApplyCouponRequest = z.infer<typeof applyCouponRequestSchema>
