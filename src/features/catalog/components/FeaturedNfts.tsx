import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/lib/http'
import { catalogQueries } from '../queries'
import { NftCard, NftCardSkeleton } from './NftCard'

const FEATURED_SLOTS = 3
// No celular, os destaques deslizam na horizontal em vez de empilhar três cartões grandes.
const ROW = 'flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:pb-0'
const SLOT = 'w-[78%] shrink-0 snap-start sm:w-auto'

export function FeaturedNfts() {
  const featured = useQuery(catalogQueries.featured())

  if (featured.isError) {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-4 rounded-2xl border-[3px] border-dashed border-ink p-5">
        <p className="font-semibold">Os destaques não carregaram. {errorMessage(featured.error)}</p>
        <Button variant="outline" onClick={() => featured.refetch()}>
          Tentar de novo
        </Button>
      </div>
    )
  }

  return (
    <ul aria-busy={featured.isPending} className={ROW}>
      {featured.isPending
        ? Array.from({ length: FEATURED_SLOTS }, (_, index) => (
            <li key={index} className={SLOT}>
              <NftCardSkeleton />
            </li>
          ))
        : featured.data.map((nft, index) => (
            <li key={nft.id} className={SLOT}>
              <NftCard nft={nft} priority={index === 0} />
            </li>
          ))}
    </ul>
  )
}
