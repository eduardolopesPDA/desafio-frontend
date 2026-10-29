import { createFileRoute } from '@tanstack/react-router'
import { AVATAR_NAMES } from '@/contracts'
import { UserAvatar } from '@/components/UserAvatar'
import { useCurrentUser } from '@/features/auth/queries'

export const Route = createFileRoute('/_authenticated/profile')({
  head: () => ({ meta: [{ title: 'Perfil | CN Toon Vault' }] }),
  component: ProfilePage,
})

const memberSince = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' })

// Somente leitura nesta fase: a edição de perfil e senha chega na Fase 6.
function ProfilePage() {
  const user = useCurrentUser()
  // O guard garante a sessão; null só por um instante, entre o "Sair" e a saída da rota privada.
  if (!user) return null

  return (
    <section aria-labelledby="perfil" className="mx-auto max-w-2xl">
      <h1 id="perfil" className="font-display text-4xl leading-tight sm:text-5xl">
        Perfil do Collector
      </h1>
      <div className="mt-6 flex flex-col gap-6 rounded-2xl border-[3px] border-ink bg-card p-5 shadow-toon sm:flex-row sm:items-center sm:p-8">
        <UserAvatar avatar={user.avatar} alt={`Avatar: ${AVATAR_NAMES[user.avatar]}`} className="size-28 border-[3px]" />
        <dl className="grid min-w-0 gap-3 text-lg">
          <div>
            <dt className="text-sm font-bold text-muted-foreground">Nome</dt>
            <dd className="font-display text-2xl break-words">{user.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-bold text-muted-foreground">E-mail</dt>
            <dd className="break-all">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-bold text-muted-foreground">Membro desde</dt>
            <dd>
              <time dateTime={user.createdAt}>{memberSince.format(new Date(user.createdAt))}</time>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
