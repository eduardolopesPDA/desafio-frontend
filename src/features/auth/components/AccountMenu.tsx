import { Link, useRouter, useRouterState } from '@tanstack/react-router'
import { LogIn, LogOut } from 'lucide-react'
import type { User } from '@/contracts'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/UserAvatar'
import { useCurrentUser, useLogout } from '../queries'

const AUTH_PAGES = new Set(['/login', '/register'])

// Volta para onde o visitante estava; em /login e /register, preserva o destino que já estava na URL.
function GuestMenu() {
  const location = useRouterState({ select: (state) => state.location })
  const redirect = AUTH_PAGES.has(location.pathname) ? location.search.redirect : location.href

  return (
    <Button asChild variant="outline">
      <Link to="/login" search={{ redirect }}>
        <LogIn aria-hidden="true" />
        Entrar
      </Link>
    </Button>
  )
}

function UserMenu({ user }: { user: User }) {
  const logout = useLogout()
  const router = useRouter()

  // Saindo de uma tela privada, vai para o catálogo (e não para o login, que o guard mostraria).
  // Numa tela pública, fica onde está: ela já reage à sessão limpa. A promise do `mutateAsync`
  // resolve mesmo depois que este menu desmonta com a sessão limpa; o `onSettled` do `mutate` não.
  const signOut = async () => {
    const onPrivateRoute = router.state.matches.some((match) => match.routeId.startsWith('/_authenticated'))
    await logout.mutateAsync()
    if (onPrivateRoute) await router.navigate({ to: '/' })
  }

  return (
    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
      <span className="flex min-w-0 items-center gap-2">
        <UserAvatar avatar={user.avatar} alt="" className="size-9" />
        {/* No celular o nome fica só para leitores de tela, para caber em 390 px. */}
        <span className="sr-only max-w-[16ch] truncate font-bold sm:not-sr-only">{user.name}</span>
      </span>
      <Button asChild variant="ghost" className="px-2.5 sm:px-3">
        <Link to="/profile" activeProps={{ className: 'bg-muted' }}>
          Perfil
        </Link>
      </Button>
      <Button variant="outline" onClick={() => void signOut()} disabled={logout.isPending} className="px-3">
        <LogOut aria-hidden="true" />
        Sair
      </Button>
    </div>
  )
}

export function AccountMenu() {
  const user = useCurrentUser()
  return user ? <UserMenu user={user} /> : <GuestMenu />
}
