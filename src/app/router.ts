import { createRouter, type RouterHistory } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { routeTree } from '@/routeTree.gen'

// Search params legíveis e iguais aos da API: listas repetem a chave (?rarity=raro&rarity=epico)
// em vez do JSON padrão do router. Cada rota valida e converte os tipos no próprio schema.
function parseSearch(searchStr: string) {
  const params = new URLSearchParams(searchStr)
  const search: Record<string, string | string[]> = {}
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key)
    search[key] = values.length > 1 ? values : values[0]!
  }
  return search
}

function stringifySearch(search: Record<string, unknown>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(search)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined && item !== null && item !== '') params.append(key, String(item))
    }
  }
  const query = params.toString()
  return query ? `?${query}` : ''
}

export function createAppRouter(opts: { history: RouterHistory; queryClient: QueryClient }) {
  return createRouter({
    routeTree,
    history: opts.history,
    context: { queryClient: opts.queryClient },
    parseSearch,
    stringifySearch,
    defaultPreload: 'intent',
    // Dados já no cache do Query: o preload do router não precisa guardar cópia própria.
    defaultPreloadStaleTime: 0,
    // Skeleton só quando a espera é perceptível, e por tempo suficiente para não piscar.
    defaultPendingMs: 400,
    defaultPendingMinMs: 300,
    scrollRestoration: true,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
