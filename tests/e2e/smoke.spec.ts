import { expect, test } from '@playwright/test'

// Fumaça da Fase 0: build web sobe, o MSW assume a rede e o roteamento resolve acesso direto.
test('abre o Toon Vault com o MSW ativo', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Toon Vault' })).toBeVisible()
  const workerUrl = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration()
    return registration?.active?.scriptURL
  })
  expect(workerUrl).toMatch(/\/mockServiceWorker\.js$/)
})

test('mostra "não encontrado" no acesso direto a uma rota inexistente', async ({ page }) => {
  await page.goto('/rota-que-nao-existe')

  await expect(page.getByText('Página não encontrada')).toBeVisible()
})
