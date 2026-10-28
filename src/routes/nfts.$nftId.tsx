import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, notFound, useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
import { SHOW_NAMES } from '@/contracts'
import { ErrorPanel, NotFoundPanel } from '@/components/feedback'
import { Price } from '@/components/Price'
import { RarityBadge } from '@/components/RarityBadge'
import { NftAttributes } from '@/features/nft/components/NftAttributes'
import { NftDetailSkeleton } from '@/features/nft/components/NftDetailSkeleton'
import { NftGallery } from '@/features/nft/components/NftGallery'
import { PurchaseOptions } from '@/features/nft/components/PurchaseOptions'
import { nftQueries } from '@/features/nft/queries'
import { ApiError, errorMessage } from '@/lib/http'

export const Route = createFileRoute('/nfts/$nftId')({
  loader: async ({ context: { queryClient }, params }) => {
    try {
      return await queryClient.ensureQueryData(nftQueries.detail(params.nftId))
    } catch (error) {
      if (error instanceof ApiError && error.code === 'NFT_NOT_FOUND') throw notFound()
      throw error
    }
  },
  head: ({ loaderData }) => ({ meta: [{ title: loaderData ? `${loaderData.name} | CN Toon Vault` : 'CN Toon Vault' }] }),
  pendingComponent: NftDetailSkeleton,
  errorComponent: NftDetailError,
  notFoundComponent: () => (
    <NotFoundPanel
      title="Nenhum NFT nesta dimensão"
      message="Esse endereço não leva a nenhuma relíquia do Toon Vault. Confira o link ou procure no catálogo."
    />
  ),
  component: NftDetailPage,
})

function NftDetailError({ error }: ErrorComponentProps) {
  const router = useRouter()
  if (error instanceof ApiError && error.code === 'NFT_BURNED') {
    return <NotFoundPanel title="Esta relíquia foi queimada" message={error.message} />
  }
  return <ErrorPanel title="O NFT não carregou" message={errorMessage(error)} onRetry={() => router.invalidate()} />
}

function BackToCatalog() {
  return (
    <Link to="/" className="inline-flex items-center gap-1 rounded-md font-bold underline decoration-2 underline-offset-4">
      <ChevronLeft aria-hidden="true" className="size-5" />
      Voltar ao catálogo
    </Link>
  )
}

function NftDetailPage() {
  const { nftId } = Route.useParams()
  const { data: nft } = useSuspenseQuery(nftQueries.detail(nftId))

  return (
    <article>
      <BackToCatalog />
      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <NftGallery images={nft.gallery} name={nft.name} />
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <RarityBadge rarity={nft.rarity} />
            <span className="font-bold">{SHOW_NAMES[nft.show]}</span>
          </div>
          <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">{nft.name}</h1>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 text-lg">
            <dt className="font-bold">Personagem</dt>
            <dd>{nft.character}</dd>
            <dt className="font-bold">Episódio</dt>
            <dd>{nft.episode}</dd>
          </dl>
          <Price price={nft.price} size="lg" className="mt-6" />
          {/* key: trocar de NFT reinicia edição e quantidade escolhidas. */}
          <PurchaseOptions key={nft.id} nft={nft} className="mt-8" />
        </div>
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:gap-12">
        <section aria-labelledby="lore">
          <h2 id="lore" className="font-display text-2xl sm:text-3xl">
            Lore
          </h2>
          <p className="mt-3 max-w-prose text-lg">{nft.lore}</p>
        </section>
        <section aria-labelledby="atributos">
          <h2 id="atributos" className="mb-4 font-display text-2xl sm:text-3xl">
            Atributos
          </h2>
          <NftAttributes attributes={nft.attributes} />
        </section>
      </div>
    </article>
  )
}
