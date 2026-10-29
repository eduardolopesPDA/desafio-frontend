import type { ReactNode } from 'react'

// Moldura das telas de Toon Pass: cartão de cartum centralizado com a faixa de xadrez no topo.
export function AuthCard({ title, children, footer }: { title: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="mx-auto max-w-lg">
      <div className="overflow-hidden rounded-2xl border-[3px] border-ink bg-card shadow-toon">
        <div aria-hidden="true" className="bg-checker h-4 border-b-[3px] border-ink [--checker-size:16px]" />
        <div className="p-5 sm:p-8">
          <h1 className="font-display text-3xl leading-tight sm:text-4xl">{title}</h1>
          {children}
        </div>
      </div>
      <p className="mt-6 text-center text-lg">{footer}</p>
    </div>
  )
}
