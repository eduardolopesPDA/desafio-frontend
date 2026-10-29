import { expect, test } from '@playwright/test'
import { accountNav, FINN, favoritesLoaded, GUMBALL, login, openFresh, toonStar } from './helpers'

// Spec §9.3 (cadastro, login, expiração de sessão, logout e troca de colecionador) e a
// validação de formulários do §9.11, no Toon Pass.

test.describe('cadastro', () => {
  test('cria o Toon Pass, entra e mostra o perfil', async ({ page }) => {
    await openFresh(page, '/register')

    await expect(page.getByRole('heading', { name: 'Criar Toon Pass' })).toBeVisible()
    const avatars = page.getByRole('radiogroup', { name: 'Avatar' })
    await expect(avatars.getByRole('radio', { name: 'Finn' })).toBeChecked()

    await page.getByLabel('Nome', { exact: true }).fill('Lindinha Utonium')
    await page.getByLabel('E-mail', { exact: true }).fill('lindinha@townsville.com')
    await page.getByLabel('Senha', { exact: true }).fill('Lindinha123')
    // O radio nativo fica escondido (sr-only); o clique vai no nome visível, dentro do label.
    await avatars.getByText('Lindinha', { exact: true }).click()
    await expect(avatars.getByRole('radio', { name: 'Lindinha' })).toBeChecked()
    await page.getByRole('button', { name: 'Criar Toon Pass' }).click()

    await expect(page).toHaveURL(/\/$/)
    await expect(accountNav(page)).toContainText('Lindinha Utonium')

    await accountNav(page).getByRole('link', { name: 'Perfil' }).click()
    await expect(page.getByRole('heading', { name: 'Perfil do Collector' })).toBeVisible()
    await expect(page.getByText('lindinha@townsville.com')).toBeVisible()
    await expect(page.getByRole('img', { name: 'Avatar: Lindinha' })).toBeVisible()

    // A conta nova fica no servidor simulado: sai e entra de novo com ela.
    await accountNav(page).getByRole('button', { name: 'Sair' }).click()
    await expect(accountNav(page).getByRole('link', { name: 'Entrar' })).toBeVisible()
    await login(page, { email: 'lindinha@townsville.com', password: 'Lindinha123', name: 'Lindinha Utonium' })
    await expect(accountNav(page)).toContainText('Lindinha Utonium')
  })

  test('mostra no campo o e-mail que já tem Toon Pass', async ({ page }) => {
    await openFresh(page, '/register')

    await page.getByLabel('Nome', { exact: true }).fill('Outro Finn')
    await page.getByLabel('E-mail', { exact: true }).fill(FINN.email)
    await page.getByLabel('Senha', { exact: true }).fill('Outro1234')
    await page.getByRole('button', { name: 'Criar Toon Pass' }).click()

    const email = page.getByLabel('E-mail', { exact: true })
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    await expect(email).toHaveAccessibleDescription('E-mail já cadastrado')
    await expect(email).toBeFocused()
    await expect(page).toHaveURL(/\/register$/)
    await expect(accountNav(page).getByRole('link', { name: 'Entrar' })).toBeVisible()
  })

  test('valida os campos antes de enviar', async ({ page }) => {
    await openFresh(page, '/register')
    const sent: string[] = []
    page.on('request', (request) => {
      if (new URL(request.url()).pathname === '/api/auth/register') sent.push(request.url())
    })

    const name = page.getByLabel('Nome', { exact: true })
    const email = page.getByLabel('E-mail', { exact: true })
    const password = page.getByLabel('Senha', { exact: true })
    const submit = page.getByRole('button', { name: 'Criar Toon Pass' })

    await submit.click()
    await expect(name).toHaveAccessibleDescription('Mínimo de 2 caracteres')
    await expect(email).toHaveAccessibleDescription('E-mail inválido')
    await expect(password).toHaveAccessibleDescription(/Mínimo de 8 caracteres$/)
    for (const field of [name, email, password]) await expect(field).toHaveAttribute('aria-invalid', 'true')
    // O foco vai para o primeiro campo com erro.
    await expect(name).toBeFocused()

    await name.fill('Jake')
    await email.fill('jake@')
    await password.fill('semnumero')
    await submit.click()
    await expect(name).not.toHaveAttribute('aria-invalid')
    await expect(email).toHaveAccessibleDescription('E-mail inválido')
    await expect(password).toHaveAccessibleDescription(/Inclua ao menos um número$/)

    await password.fill('12345678')
    await expect(password).toHaveAccessibleDescription(/Inclua ao menos uma letra$/)

    expect(sent).toEqual([])
  })
})

test.describe('login', () => {
  test('valida os campos e avisa credenciais erradas', async ({ page }) => {
    await openFresh(page, '/login')
    await expect(page.getByRole('heading', { name: 'Entrar com seu Toon Pass' })).toBeVisible()

    const email = page.getByLabel('E-mail', { exact: true })
    const password = page.getByLabel('Senha', { exact: true })
    const submit = page.getByRole('button', { name: 'Entrar', exact: true })

    await submit.click()
    await expect(email).toHaveAccessibleDescription('E-mail inválido')
    await expect(password).toHaveAccessibleDescription('Informe a senha')

    await email.fill(FINN.email)
    await password.fill('Errada123')
    await submit.click()

    await expect(page.getByRole('main').getByRole('alert')).toHaveText('E-mail ou senha incorretos.')
    await expect(page).toHaveURL(/\/login$/)
    await expect(accountNav(page).getByRole('link', { name: 'Entrar' })).toBeVisible()
  })

  test('tela privada leva ao login e volta para ela depois de entrar', async ({ page }) => {
    await openFresh(page, '/profile')

    await expect(page).toHaveURL(/\/login\?redirect=%2Fprofile$/)
    await expect(page.getByRole('heading', { name: 'Entrar com seu Toon Pass' })).toBeVisible()

    await login(page, FINN)
    await expect(page).toHaveURL(/\/profile$/)
    await expect(page.getByRole('heading', { name: 'Perfil do Collector' })).toBeVisible()
    await expect(page.getByText(FINN.email)).toBeVisible()
  })

  test('mantém a sessão após o refresh', async ({ page }) => {
    await openFresh(page, '/login?redirect=/profile')
    await login(page, FINN)

    await page.reload()
    await expect(page).toHaveURL(/\/profile$/)
    await expect(page.getByRole('heading', { name: 'Perfil do Collector' })).toBeVisible()
    await expect(accountNav(page)).toContainText(FINN.name)
    await expect(accountNav(page).getByRole('button', { name: 'Sair' })).toBeVisible()
  })
})

test('logout limpa o header e volta a proteger o perfil', async ({ page }) => {
  await openFresh(page)
  await login(page, FINN)

  // Numa tela pública, o "Sair" fica nela.
  await accountNav(page).getByRole('button', { name: 'Sair' }).click()
  await expect(accountNav(page).getByRole('link', { name: 'Entrar' })).toBeVisible()
  await expect(accountNav(page)).not.toContainText(FINN.name)
  await expect(page).toHaveURL(/\/$/)

  await page.goto('/profile')
  await expect(page).toHaveURL(/\/login\?redirect=%2Fprofile$/)

  await page.reload()
  await expect(accountNav(page).getByRole('link', { name: 'Entrar' })).toBeVisible()
})

test('sair de uma tela privada leva ao catálogo', async ({ page }) => {
  await openFresh(page, '/login?redirect=/profile')
  await login(page, FINN)
  await expect(page.getByRole('heading', { name: 'Perfil do Collector' })).toBeVisible()

  await accountNav(page).getByRole('button', { name: 'Sair' }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { name: 'Catálogo' })).toBeVisible()
  await expect(accountNav(page).getByRole('link', { name: 'Entrar' })).toBeVisible()
})

test('troca de collector não deixa nada do anterior', async ({ page }) => {
  await openFresh(page, '/nfts/enchiridion')
  const star = toonStar(page, 'Enchiridion')

  await login(page, FINN)
  await expect(page).toHaveURL(/\/nfts\/enchiridion$/)
  await expect(star).toHaveAttribute('aria-pressed', 'true')
  await expect(accountNav(page)).toContainText(FINN.name)

  // Tela pública: o "Sair" fica nela e a estrela volta a vazia.
  await accountNav(page).getByRole('button', { name: 'Sair' }).click()
  await expect(accountNav(page).getByRole('link', { name: 'Entrar' })).toBeVisible()
  await expect(star).toHaveAttribute('aria-pressed', 'false')

  const gumballFavorites = favoritesLoaded(page)
  await login(page, GUMBALL)
  await gumballFavorites
  await expect(page).toHaveURL(/\/nfts\/enchiridion$/)
  await expect(accountNav(page)).toContainText(GUMBALL.name)
  await expect(accountNav(page)).not.toContainText('Finn')
  await expect(star).toHaveAttribute('aria-pressed', 'false')

  await accountNav(page).getByRole('link', { name: 'Perfil' }).click()
  await expect(page.getByRole('heading', { name: 'Perfil do Collector' })).toBeVisible()
  await expect(page.getByText(GUMBALL.email)).toBeVisible()
  await expect(page.getByRole('main')).not.toContainText(FINN.email)
  await expect(page.getByRole('main')).not.toContainText('Finn')
})

test('sessão expirada no meio da navegação leva ao login e volta para a mesma tela', async ({ page }) => {
  await openFresh(page, '/nfts/enchiridion')
  await login(page, FINN)
  const star = toonStar(page, 'Enchiridion')
  await expect(star).toHaveAttribute('aria-pressed', 'true')

  await page.evaluate(() => window.__cnMock!.expireSessions())
  // A próxima ação privada (tirar a Toon Star) recebe 401 SESSION_EXPIRED.
  await star.click()

  await expect(page).toHaveURL(/\/login\?redirect=%2Fnfts%2Fenchiridion&reason=expired$/)
  await expect(page.getByRole('status').filter({ hasText: 'Sua sessão expirou' })).toHaveText(
    'Sua sessão expirou. Entre novamente para continuar.',
  )
  await expect(accountNav(page).getByRole('link', { name: 'Entrar' })).toBeVisible()

  const favorites = favoritesLoaded(page)
  await login(page, FINN)
  await favorites
  await expect(page).toHaveURL(/\/nfts\/enchiridion$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Enchiridion')
  // O toggle recusado não mudou nada no servidor.
  await expect(star).toHaveAttribute('aria-pressed', 'true')
})
