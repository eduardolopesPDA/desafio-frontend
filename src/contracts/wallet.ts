import { z } from 'zod'
import { dateTimeSchema, networkIdSchema } from './common'

export const walletRoleSchema = z.enum(['primary', 'secondary'])
export type WalletRole = z.infer<typeof walletRoleSchema>

export const walletAddressSchema = z
  .string()
  .trim()
  .regex(/^0x[0-9a-fA-F]{40}$/, 'Use 0x seguido de 40 caracteres hexadecimais')

export const walletSchema = z.object({
  id: z.string(),
  label: z.string(),
  address: z.string(),
  network: networkIdSchema,
  role: walletRoleSchema,
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
})
export type Wallet = z.infer<typeof walletSchema>

export const walletsResponseSchema = z.object({ items: z.array(walletSchema) })

export const createWalletRequestSchema = z.object({
  label: z.string().trim().min(2, 'Mínimo de 2 caracteres').max(30, 'Máximo de 30 caracteres'),
  address: walletAddressSchema,
  network: networkIdSchema,
  role: walletRoleSchema,
})
export type CreateWalletRequest = z.infer<typeof createWalletRequestSchema>

export const updateWalletRequestSchema = createWalletRequestSchema.omit({ role: true }).partial()
export type UpdateWalletRequest = z.infer<typeof updateWalletRequestSchema>

// Conexão simulada da carteira antes de assinar o pedido.
export const connectWalletRequestSchema = z.object({ network: networkIdSchema })
export type ConnectWalletRequest = z.infer<typeof connectWalletRequestSchema>

export const walletConnectionSchema = z.object({
  walletId: z.string(),
  network: networkIdSchema,
  connectedAt: dateTimeSchema,
})
export type WalletConnection = z.infer<typeof walletConnectionSchema>
