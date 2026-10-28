import { Link } from '@tanstack/react-router'
import { SHOW_NAMES, type NftSummary } from '@/contracts'
import { Price } from '@/components/Price'
import { RarityBadge } from '@/components/RarityBadge'
import { Skeleton } from '@/components/ui/skeleton'

const CARD = 'flex h-full flex-col overflow-hidden rounded-2xl border-[3px] border-ink bg-card shadow-toon'

// `priority`: imagem acima da dobra (LCP), carregada já e com prioridade alta.
export function NftCard({ nft, priority = false }: { nft: NftSummary; priority?: boolean }) {
  const soldOut = nft.available === 0
  return (
    <Link
      to="/nfts/$nftId"
      params={{ nftId: nft.id }}
      className={`${CARD} transition-[translate,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-toon-lg`}
    >
      <div className="relative aspect-square border-b-[3px] border-ink bg-muted">
        <img
          src={nft.image.src}
          alt={nft.image.alt}
          width={800}
          height={800}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          className="size-full object-cover"
        />
        <RarityBadge rarity={nft.rarity} className="absolute top-2.5 left-2.5" />
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="text-lg leading-snug font-bold">{nft.name}</h3>
        <p className="text-sm text-muted-foreground">{SHOW_NAMES[nft.show]}</p>
        <div className="mt-auto pt-3">
          <Price price={nft.price} />
          <p className="mt-1.5 text-sm font-semibold">
            {soldOut ? <span className="rounded-full bg-ink px-2 py-0.5 text-paper">Esgotado</span> : `${nft.available} disponíveis`}
          </p>
        </div>
      </div>
    </Link>
  )
}

// Mesmas dimensões do cartão para a grade não pular quando os dados chegam.
export function NftCardSkeleton() {
  return (
    <div aria-hidden="true" className={CARD}>
      <Skeleton className="aspect-square rounded-none border-b-[3px] border-ink" />
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="mt-1.5 h-4 w-1/2" />
        <div className="mt-auto pt-3">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="mt-1.5 h-4 w-20" />
          <Skeleton className="mt-2 h-4 w-24" />
        </div>
      </div>
    </div>
  )
}
