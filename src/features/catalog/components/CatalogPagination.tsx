import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEM = 'inline-flex h-11 min-w-11 items-center justify-center gap-1 rounded-xl border-2 border-ink px-3 font-bold'

// Links de verdade (dá para abrir em nova aba). Sem resetScroll: `onNavigate` leva o usuário ao
// topo da lista, não ao topo da página.
export function CatalogPagination({ page, pageCount, onNavigate }: { page: number; pageCount: number; onNavigate: () => void }) {
  if (pageCount <= 1) return null
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1)

  const pageLink = (target: number, children: ReactNode, label: string) => (
    <Link
      to="/"
      search={(prev) => ({ ...prev, page: target })}
      resetScroll={false}
      onClick={onNavigate}
      aria-label={label}
      className={cn(ITEM, 'bg-paper shadow-toon-sm hover:bg-accent')}
    >
      {children}
    </Link>
  )

  return (
    <nav aria-label="Paginação do catálogo" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        pageLink(page - 1, <><ChevronLeft aria-hidden="true" className="size-5" />Anterior</>, 'Página anterior')
      ) : (
        <span aria-hidden="true" className={cn(ITEM, 'border-muted-foreground/40 text-muted-foreground/60')}>
          <ChevronLeft className="size-5" />
          Anterior
        </span>
      )}
      <ol className="flex flex-wrap gap-2">
        {pages.map((target) => (
          <li key={target}>
            {target === page ? (
              <span aria-current="page" className={cn(ITEM, 'bg-ink text-paper')}>
                <span className="sr-only">Página </span>
                {target}
              </span>
            ) : (
              pageLink(target, target, `Página ${target}`)
            )}
          </li>
        ))}
      </ol>
      {page < pageCount ? (
        pageLink(page + 1, <>Próxima<ChevronRight aria-hidden="true" className="size-5" /></>, 'Próxima página')
      ) : (
        <span aria-hidden="true" className={cn(ITEM, 'border-muted-foreground/40 text-muted-foreground/60')}>
          Próxima
          <ChevronRight className="size-5" />
        </span>
      )}
    </nav>
  )
}
