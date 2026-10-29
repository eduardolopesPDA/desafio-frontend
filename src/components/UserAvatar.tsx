import type { AvatarId } from '@/contracts'
import { cn } from '@/lib/utils'

// Retrato do personagem escolhido no Toon Pass (public/avatars/<id>.webp).
export function UserAvatar({ avatar, alt, className }: { avatar: AvatarId; alt: string; className?: string }) {
  return (
    <img
      src={`/avatars/${avatar}.webp`}
      alt={alt}
      width={64}
      height={64}
      decoding="async"
      className={cn('shrink-0 rounded-full border-2 border-ink bg-muted object-cover', className)}
    />
  )
}
