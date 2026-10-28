import { expect, test, type Page } from '@playwright/test'
import { open } from './helpers'

// Infraestrutura da API simulada no navegador: service worker, persistência, cenários e socket.
// Os fluxos de tela ficam nos specs de cada feature.

function api(page: Page, path: string, init: { method?: string; body?: unknown; token?: string } = {}) {
  return page.evaluate(
    async ({ path, init }) => {
      const response = await fetch(`/api${path}`, {
        method: init.method ?? 'GET',
        headers: { 'Content-Type': 'application/json', ...(init.token && { Authorization: `Bearer ${init.token}` }) },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
      })
      return { status: response.status, body: response.status === 204 ? null : await response.json() }
    },
    { path, init },
  )
}

async function loginAsFinn(page: Page) {
  const { body } = await api(page, '/auth/login', { method: 'POST', body: { email: 'finchin@ooo.com', password: 'Finn1234' } })
  return body.token as string
}

test('responde pela rede com o contrato e sobrevive a refresh até o reset', async ({ page }) => {
  await open(page, '/?reset')
  expect((await api(page, '/nfts?q=Scooby-Doo')).body).toMatchObject({ items: [], total: 0 })

  const token = await loginAsFinn(page)
  await api(page, '/favorites/carro-de-golfe-do-parque', { method: 'PUT', token })

  await open(page, page.url())
  expect((await api(page, '/favorites', { token })).body.nftIds).toContain('carro-de-golfe-do-parque')

  await open(page, '/?reset')
  expect((await api(page, '/favorites', { token })).status).toBe(401)
})

test('?scenario= ativa o cenário, fica salvo e sai da URL', async ({ page }) => {
  await open(page, '/?scenario=server-error')

  await expect(page).toHaveURL(/\/$/)
  expect((await api(page, '/nfts')).body.error.code).toBe('INTERNAL_ERROR')

  await open(page, page.url())
  expect(await page.evaluate(() => window.__cnMock?.scenario)).toBe('server-error')

  await open(page, '/?scenario=default')
  expect((await api(page, '/nfts')).status).toBe(200)
})

test('emite nft.updated pelo Socket.IO simulado', async ({ page }) => {
  await open(page, '/?reset&scenario=default')

  const messages = await page.evaluate(async () => {
    const received: string[] = []
    const socket = new WebSocket(`${location.origin.replace(/^http/, 'ws')}/socket.io/?EIO=4&transport=websocket`)
    socket.addEventListener('message', (event) => received.push(String(event.data)))
    await new Promise((resolve) => socket.addEventListener('open', resolve))
    // CONNECT do Socket.IO, como o socket.io-client faria.
    socket.send('40')
    await new Promise((resolve) => setTimeout(resolve, 100))

    window.__cnMock!.updateNft('enchiridion', { price: { tc: '9999.00', eth: '3.3333' } })
    await new Promise((resolve) => setTimeout(resolve, 100))
    socket.close()
    return received
  })

  expect(messages[0]).toMatch(/^0\{/)
  expect(messages).toContain('40{"sid":"test"}')
  const event = messages.find((message) => message.startsWith('42'))
  expect(JSON.parse(event!.slice(2))).toEqual([
    'nft.updated',
    expect.objectContaining({ nftId: 'enchiridion', version: 2, price: { tc: '9999.00', eth: '3.3333' }, available: 2 }),
  ])
})

test('serve todas as imagens citadas pelo catálogo', async ({ page }) => {
  await open(page, '/?reset&scenario=default')
  const { body } = await api(page, '/nfts?pageSize=48')
  const details = await Promise.all(body.items.map((nft: { id: string }) => api(page, `/nfts/${nft.id}`)))
  const sources: string[] = details.flatMap(({ body: nft }) => nft.gallery.map((image: { src: string }) => image.src))

  // O preview responde index.html com 200 para arquivo inexistente: o tipo é o que prova.
  const types = await page.evaluate(
    (urls) => Promise.all(urls.map(async (url) => (await fetch(url)).headers.get('content-type'))),
    sources,
  )
  expect(sources.length).toBeGreaterThanOrEqual(15)
  expect(new Set(types)).toEqual(new Set(['image/webp']))
})
