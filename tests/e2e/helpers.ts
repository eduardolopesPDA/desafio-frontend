import { expect, type Locator, type Page } from '@playwright/test'

// O MSW sobe antes da app; sem esperar, a primeira chamada cai no servidor estático.
export async function open(page: Page, url: string) {
  await page.goto(url)
  await page.waitForFunction(() => window.__cnMock !== undefined)
}

// Começa do universo padrão no cenário pedido.
export function openFresh(page: Page, path = '/', scenario = 'default') {
  const separator = path.includes('?') ? '&' : '?'
  return open(page, `${path}${separator}reset&scenario=${scenario}`)
}

export type TestUser = { email: string; password: string; name: string }

// Usuários das fixtures. Finn já tem o Enchiridion nas Toon Stars; Gumball não tem nenhuma.
export const FINN: TestUser = { email: 'finchin@ooo.com', password: 'Finn1234', name: 'Finn Mertens' }
export const GUMBALL: TestUser = { email: 'gumball@elmore.com', password: 'Gumball1234', name: 'Gumball Watterson' }

export const accountNav = (page: Page) => page.getByRole('navigation', { name: 'Conta' })

// Entra pela UI. Fora do /login, usa o "Entrar" do header, que volta para a tela atual.
export async function login(page: Page, user: TestUser) {
  if (new URL(page.url()).pathname !== '/login') await accountNav(page).getByRole('link', { name: 'Entrar' }).click()
  await page.getByLabel('E-mail', { exact: true }).fill(user.email)
  await page.getByLabel('Senha', { exact: true }).fill(user.password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(accountNav(page).getByRole('button', { name: 'Sair' })).toBeVisible()
  await expect(page).not.toHaveURL(/\/login/)
}

// Toon Star de um NFT. O nome é fixo; marcada ou não, o estado vai só no aria-pressed.
export function toonStar(scope: Page | Locator, nftName: string) {
  return scope.getByRole('button', { name: `Toon Star: ${nftName}`, exact: true })
}

// Espera a lista de Toon Stars do usuário chegar: antes dela, toda estrela aparece vazia.
export function favoritesLoaded(page: Page) {
  return page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/api/favorites' && response.request().method() === 'GET',
  )
}
