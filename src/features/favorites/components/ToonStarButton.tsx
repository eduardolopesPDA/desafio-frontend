import { useNavigate, useRouter } from '@tanstack/react-router'
import { Star, X } from 'lucide-react'
import { useCurrentUser } from '@/features/auth/queries'
import { errorMessage } from '@/lib/http'
import { cn } from '@/lib/utils'
import { useFavoriteIds, useToggleFavorite } from '../queries'

const SIZES = {
  md: { button: 'size-10', icon: 'size-5', bubble: 'w-36' },
  lg: { button: 'size-12', icon: 'size-6', bubble: 'w-60' },
}

// Estrela de favorito. O estado vem do cache (o otimismo e o rollback estão na mutation);
// cheia ou vazia, para não depender só da cor. Visitante vai para o login e volta para cá.
export function ToonStarButton({
  nftId,
  nftName,
  size = 'md',
  className,
}: {
  nftId: string
  nftName: string
  size?: keyof typeof SIZES
  className?: string
}) {
  const user = useCurrentUser()
  const favoriteIds = useFavoriteIds()
  const isFavorite = favoriteIds?.has(nftId) ?? false
  const toggle = useToggleFavorite()
  const router = useRouter()
  const navigate = useNavigate()
  const styles = SIZES[size]
  const error = toggle.isError ? errorMessage(toggle.error) : null

  const onClick = () => {
    if (!user) {
      // Lido no clique: o cartão não precisa renderizar de novo a cada mudança de URL.
      void navigate({ to: '/login', search: { redirect: router.state.location.href } })
      return
    }
    toggle.mutate({ nftId, favorite: !isFavorite })
  }

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        aria-pressed={isFavorite}
        // Rótulo fixo: o estado vai só no aria-pressed, como pede o padrão de toggle button.
        aria-label={`Toon Star: ${nftName}`}
        onClick={onClick}
        // Até a lista de Toon Stars chegar, o estado real é desconhecido.
        disabled={favoriteIds === undefined}
        aria-busy={favoriteIds === undefined}
        className={cn(
          'grid place-items-center rounded-full border-2 border-ink bg-paper shadow-toon-sm transition-[translate,box-shadow,background-color] hover:bg-accent active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
          'aria-pressed:bg-toon-yellow disabled:cursor-progress disabled:opacity-60',
          styles.button,
        )}
      >
        <Star aria-hidden="true" strokeWidth={2.5} className={cn(styles.icon, isFavorite && 'fill-current')} />
      </button>
      {/* Região sempre presente para o leitor de tela anunciar a falha quando ela aparecer. */}
      <div className={cn('absolute top-full right-0 z-10 mt-2', styles.bubble)}>
        <p
          role="alert"
          className={
            error
              ? 'rounded-xl border-2 border-ink bg-paper py-2 pr-8 pl-3 text-sm leading-snug font-bold shadow-toon-sm'
              : 'sr-only'
          }
        >
          {error}
        </p>
        {error && (
          <button
            type="button"
            aria-label="Fechar aviso"
            onClick={() => toggle.reset()}
            className="absolute top-1 right-1 grid size-6 place-items-center rounded-full hover:bg-muted"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}
