import { Skeleton } from '@/components/ui/skeleton'

// Mesma grade e alturas da tela de detalhe, para nada pular quando os dados chegam.
export function NftDetailSkeleton() {
  return (
    <div aria-busy="true">
      <p role="status" className="sr-only">
        Carregando o NFT
      </p>
      <Skeleton className="h-6 w-40" />
      <div aria-hidden="true" className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <Skeleton className="aspect-square rounded-2xl border-[3px] border-ink" />
        <div>
          <Skeleton className="h-7 w-48 rounded-full" />
          <Skeleton className="mt-4 h-12 w-4/5" />
          <Skeleton className="mt-3 h-14 w-2/3" />
          <Skeleton className="mt-6 h-10 w-52" />
          <Skeleton className="mt-2 h-6 w-32" />
          <Skeleton className="mt-8 h-7 w-24" />
          <Skeleton className="mt-3 h-20 rounded-xl" />
          <Skeleton className="mt-3 h-20 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
