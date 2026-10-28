import { useId, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import type { NftDetail } from '@/contracts'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Edição e quantidade, limitadas pela tiragem da edição e pelo máximo por pedido.
// O botão de adicionar ao cofre entra com o carrinho (Fase 4).
export function PurchaseOptions({ nft, className }: { nft: NftDetail; className?: string }) {
  const defaultEdition = nft.editions.find((e) => e.available > 0) ?? nft.editions[0]!
  const [editionId, setEditionId] = useState(defaultEdition.id)
  const [quantity, setQuantity] = useState(1)
  const quantityId = useId()

  const edition = nft.editions.find((e) => e.id === editionId) ?? defaultEdition
  const max = Math.min(edition.available, nft.maxPerOrder)
  // A tiragem pode cair (tempo real) depois da escolha: a quantidade nunca passa do limite atual.
  const current = Math.max(1, Math.min(quantity, max))
  const soldOut = nft.available === 0

  return (
    <div className={className}>
      <fieldset>
        <legend className="mb-3 text-lg font-bold">Edição</legend>
        <div className="grid gap-3">
          {nft.editions.map((option) => {
            const unavailable = option.available === 0
            return (
              <label
                key={option.id}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl border-2 border-ink p-3.5 has-checked:bg-accent has-checked:shadow-toon-sm has-focus-visible:outline-3 has-focus-visible:outline-offset-3 has-focus-visible:outline-ring',
                  unavailable && 'cursor-not-allowed border-dashed bg-muted',
                )}
              >
                <input
                  type="radio"
                  name="edition"
                  value={option.id}
                  checked={option.id === edition.id}
                  disabled={unavailable}
                  onChange={() => setEditionId(option.id)}
                  className="size-5 accent-ink"
                />
                <span className="flex-1">
                  <span className="block font-bold">{option.name}</span>
                  <span className="block text-sm text-muted-foreground">{option.media}</span>
                </span>
                <span className={cn('text-sm font-semibold', unavailable && 'rounded-full bg-ink px-2 py-0.5 text-paper')}>
                  {unavailable ? 'Indisponível' : `${option.available} de ${option.supply}`}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      {soldOut ? (
        <p role="status" className="mt-6 rounded-xl border-2 border-ink bg-muted p-4 font-bold">
          Esgotado em todas as edições.
        </p>
      ) : (
        <div className="mt-6">
          <p id={quantityId} className="mb-3 text-lg font-bold">
            Quantidade
          </p>
          <div role="group" aria-labelledby={quantityId} className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              aria-label="Diminuir quantidade"
              disabled={current <= 1}
              onClick={() => setQuantity(current - 1)}
            >
              <Minus aria-hidden="true" />
            </Button>
            <output aria-live="polite" className="min-w-10 text-center font-display text-2xl">
              {current}
            </output>
            <Button
              variant="outline"
              size="icon"
              aria-label="Aumentar quantidade"
              disabled={current >= max}
              onClick={() => setQuantity(current + 1)}
            >
              <Plus aria-hidden="true" />
            </Button>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Até {nft.maxPerOrder} por pedido. Restam {edition.available} na {edition.name}.
          </p>
        </div>
      )}
    </div>
  )
}
