import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

// Logotipo: "CN" em casas de xadrez, como a marca do canal, e o nome da loja ao lado.
// `compact`: no celular logado, o nome some para caber o menu (o link mantém o aria-label).
function Logo({ compact }: { compact: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span aria-hidden="true" className="grid grid-cols-2 border-2 border-ink font-display text-xl leading-none">
        <span className="grid size-9 place-items-center bg-ink text-paper">C</span>
        <span className="grid size-9 place-items-center bg-paper text-ink">N</span>
      </span>
      <span className={cn('font-display text-xl leading-none sm:text-2xl', compact && 'hidden sm:inline')}>Toon Vault</span>
    </span>
  )
}

// O menu de conta vem da raiz (features/auth): componentes compartilhados não dependem de features.
export function SiteHeader({ account, compactLogo }: { account: ReactNode; compactLogo: boolean }) {
  return (
    <header className="border-b-[3px] border-ink bg-paper">
      <div aria-hidden="true" className="bg-checker h-3 [--checker-size:12px]" />
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" aria-label="CN Toon Vault, ir para o catálogo" className="shrink-0 rounded-md">
          <Logo compact={compactLogo} />
        </Link>
        <nav aria-label="Conta" className="min-w-0">
          {account}
        </nav>
      </div>
    </header>
  )
}
