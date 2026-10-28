import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import type { NftListParams } from '@/contracts'
import { ErrorPanel, StatePanel } from '@/components/feedback'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/lib/http'
import { catalogQueries } from '../queries'
import { CatalogPagination } from './CatalogPagination'
import { NftCard, NftCardSkeleton } from './NftCard'

const GRID = 'grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3'
const PAGE_SIZE = 12

export function CatalogResults({
  params,
  onClearFilters,
  onPageChange,
}: {
  params: NftListParams
  onClearFilters: () => void
  onPageChange: () => void
}) {
  const list = useQuery(catalogQueries.list(params))

  if (list.isPending) {
    return (
      <div aria-busy="true" className={GRID}>
        <p className="sr-only" role="status">
          Carregando o catálogo
        </p>
        {Array.from({ length: PAGE_SIZE }, (_, index) => (
          <NftCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (list.isError && !list.data) {
    return <ErrorPanel title="O catálogo não carregou" message={errorMessage(list.error)} onRetry={() => list.refetch()} />
  }

  const { items, total, page, pageSize } = list.data
  // Dados da busca anterior enquanto a nova não chega (keepPreviousData).
  const updating = list.isPlaceholderData

  return (
    <div>
      <p role="status" className="mb-4 font-semibold text-muted-foreground">
        {updating ? 'Atualizando resultados…' : total === 1 ? '1 NFT encontrado' : `${total} NFTs encontrados`}
      </p>

      {list.isError && (
        <div role="alert" className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border-2 border-ink bg-accent p-3">
          <p className="font-semibold">Não foi possível atualizar. {errorMessage(list.error)}</p>
          <Button variant="outline" onClick={() => list.refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {total === 0 ? (
        <StatePanel
          title="Nenhum NFT encontrado nesta dimensão"
          action={<Button onClick={onClearFilters}>Limpar busca e filtros</Button>}
        >
          <p>Tente outro nome de show, personagem ou item, ou tire alguns filtros.</p>
        </StatePanel>
      ) : items.length === 0 ? (
        <StatePanel
          title={`A página ${page} está vazia`}
          action={
            <Button asChild>
              <Link to="/" search={(prev) => ({ ...prev, page: 1 })}>
                Ir para a página 1
              </Link>
            </Button>
          }
        >
          <p>Os resultados desta busca cabem em menos páginas.</p>
        </StatePanel>
      ) : (
        <ul className={`${GRID} transition-opacity ${updating ? 'opacity-60' : ''}`}>
          {items.map((nft) => (
            <li key={nft.id}>
              <NftCard nft={nft} />
            </li>
          ))}
        </ul>
      )}

      <CatalogPagination page={page} pageCount={Math.ceil(total / pageSize)} onNavigate={onPageChange} />
    </div>
  )
}
