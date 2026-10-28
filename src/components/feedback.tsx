import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Painel para vazio, erro e não encontrado: diz o que houve e oferece a próxima ação.
export function StatePanel({
  title,
  children,
  action,
  role,
  headingLevel = 2,
  className,
}: {
  title: string
  children?: ReactNode
  action?: ReactNode
  role?: 'alert' | 'status'
  headingLevel?: 1 | 2
  className?: string
}) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2'
  return (
    <div role={role} className={cn('rounded-2xl border-[3px] border-dashed border-ink px-6 py-10 text-center', className)}>
      <Heading className="font-display text-2xl leading-tight sm:text-3xl">{title}</Heading>
      {children && <div className="mx-auto mt-3 max-w-prose text-lg text-muted-foreground">{children}</div>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  )
}

export function ErrorPanel({ title, message, onRetry }: { title: string; message: string; onRetry: () => void }) {
  return (
    <StatePanel role="alert" title={title} action={<Button onClick={onRetry}>Tentar de novo</Button>}>
      <p>{message}</p>
    </StatePanel>
  )
}

export function NotFoundPanel({ title, message }: { title: string; message: string }) {
  return (
    <StatePanel
      headingLevel={1}
      title={title}
      action={
        <Button asChild>
          <Link to="/">Ir para o catálogo</Link>
        </Button>
      }
    >
      <p>{message}</p>
    </StatePanel>
  )
}
