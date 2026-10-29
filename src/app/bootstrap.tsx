import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, type RouterHistory } from '@tanstack/react-router'
import { startMocks } from '@/mocks/browser'
import { createQueryClient } from './queryClient'
import '@/styles/globals.css'

// Único ponto da app que conhece os mocks: o MSW é a API em todos os ambientes.
export async function bootstrap({ history }: { history: RouterHistory }) {
  await startMocks()

  // O resto da app só carrega depois do MSW: o engine.io-client guarda o `WebSocket` global
  // no import, e ele precisa ser a versão interceptada pelo MSW. A sessão entra aqui também:
  // na Fase 4 ela importa o cliente do socket para desconectá-lo no logout.
  const [{ createAppRouter }, { handleSessionExpiry }] = await Promise.all([
    import('./router'),
    import('@/features/auth/session'),
  ])
  const queryClient = createQueryClient()
  const router = createAppRouter({ history, queryClient })
  // 401 de sessão expirada em qualquer requisição: limpa a sessão e leva ao login (ARCHITECTURE.md §7).
  handleSessionExpiry({ router, queryClient })

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
}
