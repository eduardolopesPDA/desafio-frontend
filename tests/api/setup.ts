import { afterAll, beforeAll, beforeEach } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from '@/mocks/handlers'
import { resetDb, walletConnections } from '@/mocks/db'
import { setLatencyEnabled, setScenario } from '@/mocks/scenarios'
import { setAccessToken } from '@/lib/http'

const server = setupServer(...handlers)

beforeAll(() => {
  setLatencyEnabled(false)
  server.listen({ onUnhandledRequest: 'error' })
})

beforeEach(() => {
  resetDb()
  walletConnections.clear()
  setScenario('default')
  setAccessToken(null)
})

afterAll(() => server.close())
