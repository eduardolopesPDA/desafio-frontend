import { z } from 'zod'
import { avatarIdSchema, emailSchema, nameSchema, passwordSchema } from './auth'

export const updateProfileRequestSchema = z
  .object({ name: nameSchema, email: emailSchema, avatar: avatarIdSchema })
  .partial()
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual'),
  newPassword: passwordSchema,
})
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>
