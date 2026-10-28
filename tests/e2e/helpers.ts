import type { Page } from '@playwright/test'

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
