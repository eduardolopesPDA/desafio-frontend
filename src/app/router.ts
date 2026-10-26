import { createRouter, type RouterHistory } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { routeTree } from '@/routeTree.gen'

export function createAppRouter(opts: { history: RouterHistory; queryClient: QueryClient }) {
  return createRouter({
    routeTree,
    history: opts.history,
    context: { queryClient: opts.queryClient },
    defaultPreload: 'intent',
    scrollRestoration: true,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
