import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { resumePendingOrders } from './handlers/orders'
import { applyUrlControls, installDevtools } from './devtools'

const worker = setupWorker(...handlers)

export async function startMocks() {
  applyUrlControls()
  await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
  resumePendingOrders()
  installDevtools()
}
