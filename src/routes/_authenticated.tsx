import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { sessionQuery } from '@/features/auth/queries'

// Layout das rotas privadas: sem sessão, vai para o login e volta para cá depois.
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context: { queryClient }, location }) => {
    const session = await queryClient.ensureQueryData(sessionQuery())
    if (!session) throw redirect({ to: '/login', search: { redirect: location.href } })
  },
  component: Outlet,
})
