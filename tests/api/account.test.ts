import { describe, expect, it } from 'vitest'
import { favoritesResponseSchema, sessionInfoSchema, sessionSchema, userSchema, walletsResponseSchema } from '@/contracts'
import { http, setAccessToken } from '@/lib/http'
import { db } from '@/mocks/db'
import { FINN, GUMBALL, failure, login } from './helpers'

describe('Toon Pass', () => {
  it('cadastra, recupera a sessão pelo token e encerra no logout', async () => {
    const body = { name: 'Marceline', email: 'Marceline@Ooo.com', password: 'Vampira123', avatar: 'finn' }
    const session = sessionSchema.parse((await http.post('/auth/register', body)).data)
    setAccessToken(session.token)

    const current = sessionInfoSchema.parse((await http.get('/auth/session')).data)
    expect(current.user).toMatchObject({ name: 'Marceline', email: 'marceline@ooo.com' })

    await http.post('/auth/logout')
    expect(await failure(http.get('/auth/session'))).toMatchObject({ status: 401, code: 'UNAUTHENTICATED' })
  })

  it('guarda a senha só como hash', async () => {
    await http.post('/auth/register', { name: 'Marceline', email: 'm@ooo.com', password: 'Vampira123', avatar: 'finn' })

    expect(JSON.stringify(db.users)).not.toContain('Vampira123')
  })

  it('aponta conflito de e-mail e campos inválidos', async () => {
    const taken = await failure(http.post('/auth/register', { name: 'Finn', email: FINN.email, password: 'Outra1234', avatar: 'finn' }))
    expect(taken).toMatchObject({ status: 409, code: 'EMAIL_TAKEN', fields: { email: 'E-mail já cadastrado' } })

    const invalid = await failure(http.post('/auth/register', { name: 'F', email: 'x', password: 'curta', avatar: 'finn' }))
    expect(invalid.code).toBe('VALIDATION_ERROR')
    expect(Object.keys(invalid.fields ?? {}).sort()).toEqual(['email', 'name', 'password'])
  })

  it('recusa senha errada sem dizer qual campo errou', async () => {
    expect(await failure(http.post('/auth/login', { ...FINN, password: 'Errada123' }))).toMatchObject({
      status: 401,
      code: 'INVALID_CREDENTIALS',
      fields: undefined,
    })
  })

  it('responde SESSION_EXPIRED quando a sessão vence', async () => {
    await login()
    for (const session of db.sessions) session.expiresAt = new Date(0).toISOString()

    expect(await failure(http.get('/favorites'))).toMatchObject({ status: 401, code: 'SESSION_EXPIRED' })
  })
})

describe('Toon Stars', () => {
  it('isola os favoritos de cada colecionador', async () => {
    await login(FINN)
    await http.put('/favorites/carro-de-golfe-do-parque')
    const finn = favoritesResponseSchema.parse((await http.get('/favorites')).data)

    await login(GUMBALL)
    const gumball = favoritesResponseSchema.parse((await http.get('/favorites')).data)

    expect(finn.nftIds).toEqual(['enchiridion', 'carro-de-golfe-do-parque'])
    expect(gumball.nftIds).toEqual(['aquario-do-darwin'])
  })

  it('exige sessão', async () => {
    expect(await failure(http.put('/favorites/enchiridion'))).toMatchObject({ status: 401, code: 'UNAUTHENTICATED' })
  })
})

describe('Perfil', () => {
  it('atualiza dados e avatar, e recusa e-mail de outro colecionador', async () => {
    await login()
    const user = userSchema.parse((await http.patch('/profile', { name: 'Finn, o Humano', avatar: 'jake' })).data)
    expect(user).toMatchObject({ name: 'Finn, o Humano', avatar: 'jake' })

    expect(await failure(http.patch('/profile', { email: GUMBALL.email }))).toMatchObject({ status: 409, code: 'EMAIL_TAKEN' })
  })

  it('troca a senha só com a senha atual correta', async () => {
    await login()
    const wrong = await failure(http.post('/profile/password', { currentPassword: 'Errada123', newPassword: 'NovaSenha1' }))
    expect(wrong.fields).toEqual({ currentPassword: 'Senha atual incorreta' })

    await http.post('/profile/password', { currentPassword: FINN.password, newPassword: 'NovaSenha1' })
    await login({ ...FINN, password: 'NovaSenha1' })
  })
})

describe('Carteiras', () => {
  it('cadastra a secundária e recusa uma segunda principal', async () => {
    await login(GUMBALL)
    const wallet = { label: 'Bolso do Darwin', address: `0x${'d'.repeat(40)}`, network: 'park', role: 'secondary' }
    await http.post('/wallets', wallet)

    const { items } = walletsResponseSchema.parse((await http.get('/wallets')).data)
    expect(items.map((w) => w.role)).toEqual(['primary', 'secondary'])

    const duplicate = await failure(http.post('/wallets', { ...wallet, role: 'primary' }))
    expect(duplicate.fields).toEqual({ role: 'Você já tem uma carteira principal' })
  })

  it('valida o endereço e não deixa editar carteira alheia', async () => {
    await login(GUMBALL)
    const invalid = await failure(http.post('/wallets', { label: 'X', address: '0x123', network: 'ooo', role: 'secondary' }))
    expect(Object.keys(invalid.fields ?? {}).sort()).toEqual(['address', 'label'])

    expect(await failure(http.patch('/wallets/wallet-finn-1', { label: 'Minha agora' }))).toMatchObject({ status: 403, code: 'FORBIDDEN' })
  })
})
