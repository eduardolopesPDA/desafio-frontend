import { HttpResponse } from 'msw'
import { changePasswordRequestSchema, updateProfileRequestSchema } from '@/contracts'
import { db } from '../db'
import { MockError, noContent, parseBody, route } from '../http'
import { checkPassword, requireUser, setPassword, toUser } from '../session'

export const profileHandlers = [
  route('get', '/profile', ({ request }) => HttpResponse.json(toUser(requireUser(request)))),

  route('patch', '/profile', async ({ request }) => {
    const user = requireUser(request)
    const body = await parseBody(request, updateProfileRequestSchema)
    if (body.email && db.users.some((u) => u.email === body.email && u.id !== user.id)) {
      throw new MockError(409, 'EMAIL_TAKEN', 'Este e-mail já tem um Toon Pass.', { email: 'E-mail já cadastrado' })
    }
    Object.assign(user, body)
    return HttpResponse.json(toUser(user))
  }),

  route('post', '/profile/password', async ({ request }) => {
    const user = requireUser(request)
    const body = await parseBody(request, changePasswordRequestSchema)
    if (!(await checkPassword(user, body.currentPassword))) {
      throw new MockError(422, 'VALIDATION_ERROR', 'Confira os campos destacados.', { currentPassword: 'Senha atual incorreta' })
    }
    if (body.newPassword === body.currentPassword) {
      throw new MockError(422, 'VALIDATION_ERROR', 'Confira os campos destacados.', {
        newPassword: 'A nova senha deve ser diferente da atual',
      })
    }
    await setPassword(user, body.newPassword)
    return noContent()
  }),
]
