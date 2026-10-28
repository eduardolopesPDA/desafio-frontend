import { Circle, Diamond, Hexagon, Sparkles, Star, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RARITY_NAMES, type Rarity } from '@/contracts'

// Cada raridade tem cor e forma próprias: o selo não depende só da cor.
const STYLES: Record<Rarity, { icon: LucideIcon; className: string }> = {
  comum: { icon: Circle, className: 'bg-[#e9ecef]' },
  raro: { icon: Diamond, className: 'bg-[#a5d8ff]' },
  epico: { icon: Hexagon, className: 'bg-[#d0bfff]' },
  lendario: { icon: Star, className: 'bg-[#ffd8a8]' },
  mitico: { icon: Sparkles, className: 'bg-[#fcc2d7]' },
}

export function RarityBadge({ rarity, className }: { rarity: Rarity; className?: string }) {
  const { icon: Icon, className: color } = STYLES[rarity]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border-2 border-ink px-2.5 py-0.5 text-sm leading-5 font-bold',
        color,
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5 fill-current" strokeWidth={2.5} />
      {RARITY_NAMES[rarity]}
    </span>
  )
}
