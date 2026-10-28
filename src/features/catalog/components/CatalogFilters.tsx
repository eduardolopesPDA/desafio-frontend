import { useId, useState } from 'react'
import { Check, SlidersHorizontal } from 'lucide-react'
import { RARITY_NAMES, raritySchema, SHOW_NAMES, showIdSchema, type Rarity, type ShowId } from '@/contracts'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Record<T, string>
  value: T[]
  onChange: (value: T[]) => void
}) {
  const labelId = useId()
  return (
    <div>
      <h3 id={labelId} className="mb-2 text-base font-bold">
        {label}
      </h3>
      <ToggleGroup
        type="multiple"
        aria-labelledby={labelId}
        value={value}
        onValueChange={(next) => onChange(next as T[])}
        className="flex-wrap"
      >
        {(Object.entries(options) as [T, string][]).map(([option, name]) => (
          <ToggleGroupItem key={option} value={option}>
            <Check aria-hidden="true" className="hidden size-4 group-data-[state=on]/toggle:block" strokeWidth={3} />
            {name}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

const RARITY_OPTIONS = Object.fromEntries(raritySchema.options.map((r) => [r, RARITY_NAMES[r]])) as Record<Rarity, string>
const SHOW_OPTIONS = Object.fromEntries(showIdSchema.options.map((s) => [s, SHOW_NAMES[s]])) as Record<ShowId, string>

// No celular os filtros ficam recolhidos atrás de um botão; do tablet em diante, sempre à vista.
export function CatalogFilters({
  rarity,
  show,
  onChange,
}: {
  rarity: Rarity[]
  show: ShowId[]
  onChange: (filters: { rarity?: Rarity[]; show?: ShowId[] }) => void
}) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const active = rarity.length + show.length

  return (
    <div>
      <Button variant="outline" className="md:hidden" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)}>
        <SlidersHorizontal aria-hidden="true" />
        {active > 0 ? `Filtros (${active})` : 'Filtros'}
      </Button>
      <div id={panelId} className={`${open ? 'mt-4 grid' : 'hidden'} gap-5 md:mt-0 md:grid`}>
        <FilterGroup label="Raridade" options={RARITY_OPTIONS} value={rarity} onChange={(next) => onChange({ rarity: next })} />
        <FilterGroup label="Show de origem" options={SHOW_OPTIONS} value={show} onChange={(next) => onChange({ show: next })} />
      </div>
    </div>
  )
}
