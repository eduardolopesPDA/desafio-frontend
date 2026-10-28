import { Link } from '@tanstack/react-router'

// Logotipo: "CN" em casas de xadrez, como a marca do canal, e o nome da loja ao lado.
function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span aria-hidden="true" className="grid grid-cols-2 border-2 border-ink font-display text-xl leading-none">
        <span className="grid size-9 place-items-center bg-ink text-paper">C</span>
        <span className="grid size-9 place-items-center bg-paper text-ink">N</span>
      </span>
      <span className="font-display text-xl leading-none sm:text-2xl">Toon Vault</span>
    </span>
  )
}

export function SiteHeader() {
  return (
    <header className="border-b-[3px] border-ink bg-paper">
      <div aria-hidden="true" className="bg-checker h-3 [--checker-size:12px]" />
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6">
        <Link to="/" aria-label="CN Toon Vault, ir para o catálogo" className="rounded-md">
          <Logo />
        </Link>
      </div>
    </header>
  )
}
