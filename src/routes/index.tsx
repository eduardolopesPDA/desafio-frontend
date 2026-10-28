import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { z } from 'zod'
import { nftSortSchema, raritySchema, showIdSchema, type NftListParams } from '@/contracts'
import { CatalogFilters } from '@/features/catalog/components/CatalogFilters'
import { CatalogResults } from '@/features/catalog/components/CatalogResults'
import { CatalogToolbar } from '@/features/catalog/components/CatalogToolbar'
import { FeaturedNfts } from '@/features/catalog/components/FeaturedNfts'

// Um valor só chega como string; vários, como lista (ver parseSearch em app/router.ts).
const listOf = <T extends z.ZodType>(item: T) =>
  z
    .union([z.array(item), item.transform((value) => [value])])
    .default([])
    .catch([])

// Tudo opcional na URL; valor ausente ou inválido cai no padrão em vez de quebrar a página.
const catalogSearchSchema = z.object({
  q: z.string().trim().default('').catch(''),
  rarity: listOf(raritySchema),
  show: listOf(showIdSchema),
  sort: nftSortSchema.default('newest').catch('newest'),
  page: z.coerce.number().int().min(1).default(1).catch(1),
})
type CatalogSearch = z.output<typeof catalogSearchSchema>

const DEFAULTS: CatalogSearch = { q: '', rarity: [], show: [], sort: 'newest', page: 1 }

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  // Padrões não aparecem na URL: "/" e "/?page=1" são a mesma página.
  search: { middlewares: [stripSearchParams(DEFAULTS)] },
  head: () => ({ meta: [{ title: 'CN Toon Vault: relíquias e cards do Cartoon Network' }] }),
  component: CatalogPage,
})

function CatalogPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  // Mudar busca, filtro ou ordem volta para a página 1, sem rolar a página.
  const update = (patch: Partial<CatalogSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch, page: 1 }), resetScroll: false })

  const params: NftListParams = {
    q: search.q || undefined,
    rarity: search.rarity,
    show: search.show,
    sort: search.sort,
    page: search.page,
  }

  return (
    <>
      <section aria-labelledby="destaques">
        <h1 className="font-display text-5xl leading-[0.95] sm:text-7xl">Toon Vault</h1>
        <p className="mt-3 max-w-2xl text-xl">
          Relíquias e cards colecionáveis dos desenhos do Cartoon Network, de Hora de Aventura a Coragem, o Cão Covarde.
        </p>
        <h2 id="destaques" className="mt-10 mb-4 font-display text-2xl sm:text-3xl">
          Destaques da semana
        </h2>
        <FeaturedNfts />
      </section>

      <section aria-labelledby="catalogo" className="mt-16">
        <h2 id="catalogo" tabIndex={-1} className="mb-6 scroll-mt-6 font-display text-3xl outline-none sm:text-4xl">
          Catálogo
        </h2>
        <CatalogToolbar
          query={search.q}
          sort={search.sort}
          onQueryChange={(q) => update({ q })}
          onSortChange={(sort) => update({ sort })}
        />
        <div className="mt-6 grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
          <CatalogFilters rarity={search.rarity} show={search.show} onChange={update} />
          <CatalogResults
            params={params}
            onClearFilters={() => navigate({ search: {}, resetScroll: false })}
            onPageChange={() => {
              const heading = document.getElementById('catalogo')
              heading?.scrollIntoView()
              heading?.focus({ preventScroll: true })
            }}
          />
        </div>
      </section>
    </>
  )
}
