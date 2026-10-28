import { createRootRouteWithContext, HeadContent, Outlet } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { NotFoundPanel } from '@/components/feedback'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'

// Foca o <main> sem mexer no hash: na extensão o hash é a rota.
function SkipLink() {
  return (
    <a
      href="#conteudo"
      onClick={(event) => {
        event.preventDefault()
        document.getElementById('conteudo')?.focus()
      }}
      className="sr-only rounded-xl border-2 border-ink bg-toon-yellow px-4 py-2 font-bold focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50"
    >
      Pular para o conteúdo
    </a>
  )
}

function RootLayout() {
  return (
    <>
      <HeadContent />
      <SkipLink />
      <SiteHeader />
      <main id="conteudo" tabIndex={-1} className="mx-auto max-w-7xl px-4 pt-8 outline-none sm:px-6">
        <Outlet />
      </main>
      <SiteFooter />
    </>
  )
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({ meta: [{ title: 'CN Toon Vault' }] }),
  component: RootLayout,
  notFoundComponent: () => (
    <NotFoundPanel title="Página não encontrada" message="Este endereço não leva a nenhuma dimensão do Toon Vault." />
  ),
})
