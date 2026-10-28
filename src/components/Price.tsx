import type { Money } from '@/contracts'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

// TC em destaque, ETH como equivalente logo abaixo.
export function Price({ price, size = 'md', className }: { price: Money; size?: 'md' | 'lg'; className?: string }) {
  return (
    <p className={cn('flex flex-col', className)}>
      <span className={cn('font-display leading-tight', size === 'lg' ? 'text-3xl sm:text-4xl' : 'text-lg')}>
        {formatMoney(price.tc, 'tc')}
      </span>
      <span className={cn('font-semibold text-muted-foreground', size === 'lg' ? 'text-lg' : 'text-sm')}>
        {formatMoney(price.eth, 'eth')}
      </span>
    </p>
  )
}
