import { useEffect, useId, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import type { NftSort } from '@/contracts'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const SORT_LABELS: Record<NftSort, string> = {
  newest: 'Mais recentes',
  price_asc: 'Menor preço',
  price_desc: 'Maior preço',
  rarity: 'Mais raros',
}

const SEARCH_DELAY_MS = 350

export function CatalogToolbar({
  query,
  sort,
  onQueryChange,
  onSortChange,
}: {
  query: string
  sort: NftSort
  onQueryChange: (query: string) => void
  onSortChange: (sort: NftSort) => void
}) {
  const searchId = useId()
  const sortId = useId()
  const [draft, setDraft] = useState(query)
  const [syncedQuery, setSyncedQuery] = useState(query)
  const timer = useRef<number | undefined>(undefined)

  // A URL mudou por fora (voltar/avançar no histórico): o campo acompanha.
  if (query !== syncedQuery) {
    setSyncedQuery(query)
    setDraft(query)
  }

  useEffect(() => () => window.clearTimeout(timer.current), [])

  function apply(value: string) {
    window.clearTimeout(timer.current)
    onQueryChange(value.trim())
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <form
        role="search"
        className="flex-1"
        onSubmit={(event) => {
          event.preventDefault()
          apply(draft)
        }}
      >
        <label htmlFor={searchId} className="mb-1.5 block font-bold">
          Buscar por show, personagem ou item
        </label>
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2" />
          <Input
            id={searchId}
            type="search"
            value={draft}
            placeholder="Ex.: Apenas um Show"
            autoComplete="off"
            className="pl-11"
            onChange={(event) => {
              const value = event.target.value
              setDraft(value)
              window.clearTimeout(timer.current)
              timer.current = window.setTimeout(() => apply(value), SEARCH_DELAY_MS)
            }}
          />
        </div>
      </form>
      <div>
        <label id={sortId} className="mb-1.5 block font-bold">
          Ordenar por
        </label>
        <Select value={sort} onValueChange={(value) => onSortChange(value as NftSort)}>
          <SelectTrigger aria-labelledby={sortId} className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(SORT_LABELS) as [NftSort, string][]).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
