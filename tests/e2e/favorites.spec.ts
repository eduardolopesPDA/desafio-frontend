import { expect, test, type Page } from '@playwright/test'
import { FINN, favoritesLoaded, GUMBALL, login, openFresh, toonStar, type TestUser } from './helpers'

// Spec §9.4: Toon Stars otimistas, falha da mutation com rollback e recuperação.

const catalog = (page: Page) => page.getByRole('region', { name: 'Catálogo' })
const featured = (page: Page) => page.getByRole('region', { name: 'Destaques da semana' })

// PUT (marcar) ou DELETE (desmarcar) de um NFT terminou no servidor.
function favoriteSaved(page: Page, method: 'PUT' | 'DELETE', nftId: string) {
  return page.waitForResponse(
    (response) =>
      response.request().method() === method && new URL(response.url()).pathname === `/api/favorites/${nftId}`,
  )
}

// Entra e espera a lista de Toon Stars: antes dela, toda estrela aparece vazia.
async function loginWithFavorites(page: Page, user: TestUser) {
  const loaded = favoritesLoaded(page)
  await login(page, user)
  await loaded
}

async function reloadWithFavorites(page: Page) {
  const loaded = favoritesLoaded(page)
  await page.reload()
  await loaded
}

test('visitante vai ao login pela estrela e volta para a mesma busca', async ({ page }) => {
  await openFresh(page, '/?q=Gumball')
  const star = toonStar(catalog(page), 'Controle Remoto dos Watterson')

  await star.click()
  await expect(page).toHaveURL(/\/login\?redirect=%2F%3Fq%3DGumball$/)

  await login(page, GUMBALL)
  await expect(page).toHaveURL(/\/\?q=Gumball$/)
  await expect(star).toHaveAttribute('aria-pressed', 'false')
})

test('marca e desmarca, e o estado sobrevive ao refresh', async ({ page }) => {
  await openFresh(page, '/?q=Carro+de+Golfe')
  await loginWithFavorites(page, GUMBALL)
  const star = toonStar(catalog(page), 'Carro de Golfe do Parque')
  await expect(star).toHaveAttribute('aria-pressed', 'false')

  const added = favoriteSaved(page, 'PUT', 'carro-de-golfe-do-parque')
  await star.click()
  await expect(star).toHaveAttribute('aria-pressed', 'true')
  await added
  await reloadWithFavorites(page)
  await expect(star).toHaveAttribute('aria-pressed', 'true')

  const removed = favoriteSaved(page, 'DELETE', 'carro-de-golfe-do-parque')
  await star.click()
  await expect(star).toHaveAttribute('aria-pressed', 'false')
  await removed
  await reloadWithFavorites(page)
  await expect(star).toHaveAttribute('aria-pressed', 'false')
})

test('a estrela do cartão e a do detalhe mostram o mesmo estado', async ({ page }) => {
  await openFresh(page)
  await login(page, FINN)
  const cardStar = toonStar(featured(page), 'Enchiridion')
  const detailStar = toonStar(page.getByRole('main'), 'Enchiridion')
  await expect(cardStar).toHaveAttribute('aria-pressed', 'true')

  await featured(page).getByRole('link', { name: 'Enchiridion', exact: true }).click()
  // A URL muda antes de o detalhe trocar o catálogo na tela.
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Enchiridion')
  await expect(detailStar).toHaveAttribute('aria-pressed', 'true')

  const removed = favoriteSaved(page, 'DELETE', 'enchiridion')
  await detailStar.click()
  await expect(detailStar).toHaveAttribute('aria-pressed', 'false')
  await removed

  await page.goBack()
  await expect(cardStar).toHaveAttribute('aria-pressed', 'false')

  const added = favoriteSaved(page, 'PUT', 'enchiridion')
  await cardStar.click()
  await expect(cardStar).toHaveAttribute('aria-pressed', 'true')
  await added

  await featured(page).getByRole('link', { name: 'Enchiridion', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Enchiridion')
  await expect(detailStar).toHaveAttribute('aria-pressed', 'true')
})

test('cliques seguidos: o último vence, na tela e no servidor', async ({ page }) => {
  await openFresh(page, '/nfts/carro-de-golfe-do-parque')
  await loginWithFavorites(page, GUMBALL)
  const star = toonStar(page, 'Carro de Golfe do Parque')
  await expect(star).toHaveAttribute('aria-pressed', 'false')

  // Depois do último toggle, a lista é buscada de novo: é o sinal de que a fila acabou.
  const settled = favoritesLoaded(page)
  await star.click()
  await star.click()
  await star.click()
  await expect(star).toHaveAttribute('aria-pressed', 'true')
  await settled
  await expect(star).toHaveAttribute('aria-pressed', 'true')

  await reloadWithFavorites(page)
  await expect(star).toHaveAttribute('aria-pressed', 'true')
})

test('falha ao salvar desfaz a estrela, avisa e se recupera', async ({ page }) => {
  // favorite-error: PUT e DELETE de /favorites respondem 503.
  await openFresh(page, '/nfts/enchiridion', 'favorite-error')
  await login(page, FINN)
  const star = toonStar(page, 'Enchiridion')
  const alert = page.getByRole('main').getByRole('alert')
  await expect(star).toHaveAttribute('aria-pressed', 'true')
  await expect(alert).toHaveText('')

  await star.click()
  // Otimista: desmarca na hora e volta quando o servidor recusa.
  await expect(star).toHaveAttribute('aria-pressed', 'false')
  await expect(alert).toHaveText('Não foi possível salvar a Toon Star.')
  await expect(star).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('button', { name: 'Fechar aviso' }).click()
  await expect(alert).toHaveText('')

  // O servidor volta: a mesma ação agora funciona e fica salva.
  await page.evaluate(() => window.__cnMock!.setScenario('default'))
  const removed = favoriteSaved(page, 'DELETE', 'enchiridion')
  await star.click()
  await expect(star).toHaveAttribute('aria-pressed', 'false')
  expect((await removed).status()).toBe(204)
  await expect(alert).toHaveText('')

  await reloadWithFavorites(page)
  await expect(star).toHaveAttribute('aria-pressed', 'false')
})

test('clique antes de a lista de Toon Stars chegar respeita o estado real', async ({ page }) => {
  // slow-network: toda resposta leva 2,5 s, então a lista ainda está a caminho depois do login.
  await openFresh(page, '/nfts/enchiridion', 'slow-network')
  await login(page, FINN)
  const star = toonStar(page, 'Enchiridion')

  const saved = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/api/favorites/enchiridion',
    { timeout: 10_000 },
  )
  await star.click()
  await saved

  await page.evaluate(() => window.__cnMock!.setScenario('default'))
  await reloadWithFavorites(page)
  await expect(star).toHaveAttribute('aria-pressed', 'false')
})
