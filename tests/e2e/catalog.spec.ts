import { expect, test, type Page } from '@playwright/test'
import { openFresh } from './helpers'

// Spec §9.1 (busca, filtros, ordenação, paginação, histórico), §9.2 (detalhe) e §9.12 no catálogo.

const catalog = (page: Page) => page.getByRole('region', { name: 'Catálogo' })
// Títulos dos cartões (os grupos de filtro também são h3, mas não estão em lista).
const cardTitles = (page: Page) => catalog(page).getByRole('listitem').getByRole('heading', { level: 3 })
const resultCount = (page: Page) => catalog(page).getByRole('status').filter({ hasText: /encontrad/ })

// No celular os filtros ficam atrás do botão "Filtros".
async function filterChip(page: Page, group: 'Raridade' | 'Show de origem', option: string) {
  const toggle = page.getByRole('button', { name: /^Filtros/ })
  if ((await toggle.isVisible()) && (await toggle.getAttribute('aria-expanded')) === 'false') await toggle.click()
  return catalog(page).getByRole('toolbar', { name: group }).getByRole('button', { name: option })
}

async function filter(page: Page, group: 'Raridade' | 'Show de origem', option: string) {
  await (await filterChip(page, group, option)).click()
}

async function search(page: Page, text: string) {
  const box = page.getByRole('searchbox', { name: 'Buscar por show, personagem ou item' })
  await box.fill(text)
  await box.press('Enter')
}

test('busca por show e por item, sem acento', async ({ page }) => {
  await openFresh(page)

  await search(page, 'Apenas um Show')
  await expect(page).toHaveURL(/q=Apenas\+um\+Show/)
  await expect(resultCount(page)).toHaveText('3 NFTs encontrados')
  await expect(cardTitles(page)).toHaveText(['Fita de Vídeo do Mordecai', 'Carro de Golfe do Parque', 'Moletom do Rigby'])

  await search(page, 'carro de golfe')
  await expect(cardTitles(page)).toHaveText(['Carro de Golfe do Parque'])

  await search(page, 'clarencio')
  await expect(resultCount(page)).toHaveText('2 NFTs encontrados')
})

test('combina filtros, zera a página e restaura pelo histórico e pelo refresh', async ({ page }) => {
  await openFresh(page)

  await page.getByRole('navigation', { name: 'Paginação do catálogo' }).getByRole('link', { name: 'Página 2' }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(cardTitles(page)).toHaveCount(3)

  await filter(page, 'Raridade', 'Lendário')
  await expect(page).not.toHaveURL(/page=/)
  await expect(resultCount(page)).toHaveText('3 NFTs encontrados')

  await filter(page, 'Show de origem', 'Hora de Aventura')
  await expect(page).toHaveURL(/rarity=lendario&show=hora-de-aventura/)
  await expect(cardTitles(page)).toHaveText(['Espada de Sangue de Demônio'])

  await page.goBack()
  await expect(resultCount(page)).toHaveText('3 NFTs encontrados')
  await page.goForward()
  await expect(cardTitles(page)).toHaveText(['Espada de Sangue de Demônio'])

  await page.reload()
  await expect(cardTitles(page)).toHaveText(['Espada de Sangue de Demônio'])
  await expect(await filterChip(page, 'Raridade', 'Lendário')).toHaveAttribute('aria-pressed', 'true')
})

test('ordena por preço', async ({ page }) => {
  await openFresh(page)

  await page.getByRole('combobox', { name: 'Ordenar por' }).click()
  await page.getByRole('option', { name: 'Menor preço' }).click()

  await expect(page).toHaveURL(/sort=price_asc/)
  await expect(cardTitles(page).first()).toHaveText('Chapéu do Jeff')
})

test('mostra resultado vazio e limpa a busca', async ({ page }) => {
  await openFresh(page)

  await search(page, 'Scooby-Doo')
  await expect(catalog(page).getByRole('heading', { name: 'Nenhum NFT encontrado nesta dimensão' })).toBeVisible()

  await catalog(page).getByRole('button', { name: 'Limpar busca e filtros' }).click()
  await expect(resultCount(page)).toHaveText('15 NFTs encontrados')
})

test('a listagem antiga e lenta não sobrescreve a busca nova', async ({ page }) => {
  // out-of-order: a 1ª listagem leva 2 s, a 2ª 300 ms.
  const initialList = (url: string) => url.endsWith('/api/nfts?sort=newest&page=1')
  // A antiga ou é cancelada (o Query aborta a busca sem observador) ou chega atrasada: as duas valem.
  const staleSettled = Promise.race([
    page.waitForEvent('requestfailed', (request) => initialList(request.url())),
    page.waitForResponse((response) => initialList(response.url())),
  ])
  await openFresh(page, '/', 'out-of-order')

  await search(page, 'Gumball')
  await expect(resultCount(page)).toHaveText('3 NFTs encontrados')
  await staleSettled
  await expect(resultCount(page)).toHaveText('3 NFTs encontrados')
  await expect(cardTitles(page).first()).toHaveText('Controle Remoto dos Watterson')
})

test('mostra skeletons na rede lenta', async ({ page }) => {
  await openFresh(page, '/', 'slow-network')

  await expect(catalog(page).getByRole('status').filter({ hasText: 'Carregando o catálogo' })).toBeAttached()
  await expect(resultCount(page)).toHaveText('15 NFTs encontrados', { timeout: 10_000 })
})

test('avisa a falha do catálogo e se recupera ao tentar de novo', async ({ page }) => {
  // catalog-error: 503 nas 3 primeiras chamadas (a inicial e as 2 novas tentativas automáticas).
  await openFresh(page, '/', 'catalog-error')

  const alert = catalog(page).getByRole('alert')
  await expect(alert).toContainText('O catálogo não carregou', { timeout: 15_000 })
  await expect(alert).toContainText('O Toon Vault está instável')

  await alert.getByRole('button', { name: 'Tentar de novo' }).click()
  await expect(resultCount(page)).toHaveText('15 NFTs encontrados')
})

test.describe('detalhe', () => {
  test('abre pelo catálogo e volta', async ({ page }) => {
    await openFresh(page)

    await catalog(page).getByRole('link', { name: /Coroa do Rei Gelado/ }).click()
    await expect(page).toHaveURL(/\/nfts\/coroa-do-rei-gelado$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Coroa do Rei Gelado')
    // Edição esgotada fica visível, mas não dá para escolher.
    await expect(page.getByRole('radio', { name: /Edição Holográfica/ })).toBeDisabled()

    await page.getByRole('link', { name: 'Voltar ao catálogo' }).click()
    await expect(page.getByRole('heading', { name: 'Catálogo' })).toBeVisible()
  })

  test('acesso direto ao Enchiridion com tiragem limitada', async ({ page }) => {
    await openFresh(page, '/nfts/enchiridion')

    await expect(page).toHaveTitle('Enchiridion | CN Toon Vault')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Enchiridion')
    await expect(page.getByRole('radio', { name: /Edição Única/ })).toBeChecked()
    // Máximo de 1 por pedido.
    await expect(page.getByRole('button', { name: 'Aumentar quantidade' })).toBeDisabled()
    await expect(page.getByRole('meter', { name: 'Nostalgia' })).toHaveAttribute('aria-valuenow', '99')
  })

  test('limita a quantidade ao máximo por pedido', async ({ page }) => {
    await openFresh(page, '/nfts/espada-de-sangue-de-demonio')

    const increase = page.getByRole('button', { name: 'Aumentar quantidade' })
    await increase.click()
    await increase.click()
    await expect(page.getByRole('group', { name: 'Quantidade' }).locator('output')).toHaveText('3')
    await expect(increase).toBeDisabled()
  })

  test('trata NFT inexistente, queimado e esgotado', async ({ page }) => {
    await openFresh(page, '/nfts/nao-existe')
    await expect(page.getByRole('heading', { name: 'Nenhum NFT nesta dimensão' })).toBeVisible()

    await page.goto('/nfts/gema-do-lich')
    await expect(page.getByRole('heading', { name: 'Esta relíquia foi queimada' })).toBeVisible()

    await page.goto('/nfts/moletom-do-rigby')
    await expect(page.getByText('Esgotado em todas as edições.')).toBeVisible()
  })
})
