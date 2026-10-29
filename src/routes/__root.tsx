import { createRootRouteWithContext, HeadContent, Outlet } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { NotFoundPanel } from '@/components/feedback'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { AccountMenu } from '@/features/auth/components/AccountMenu'
import { sessionQuery, useCurrentUser } from '@/features/auth/queries'

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
  const user = useCurrentUser()
  return (
    <>
      <HeadContent />
      <SkipLink />
      <SiteHeader account={<AccountMenu />} compactLogo={user !== null} />
      <main id="conteudo" tabIndex={-1} className="mx-auto max-w-7xl px-4 pt-8 outline-none sm:px-6">
        <Outlet />
      </main>
      <SiteFooter />
    </>
  )
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  // A sessão entra no cache antes de qualquer tela: `useCurrentUser` nunca fica pendente. Só faz
  // requisição na primeira navegação (e só com token salvo); falha de rede não derruba a app.
  beforeLoad: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(sessionQuery())
  },
  head: () => ({ meta: [{ title: 'CN Toon Vault' }] }),
  component: RootLayout,
  notFoundComponent: () => (
    <NotFoundPanel title="Página não encontrada" message="Este endereço não leva a nenhuma dimensão do Toon Vault." />
  ),
})
