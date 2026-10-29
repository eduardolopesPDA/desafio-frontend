import { useId, type ComponentProps } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Campo de texto com label, dica e erro associados (aria-describedby / aria-invalid).
export function TextField({
  label,
  hint,
  error,
  className,
  ...inputProps
}: { label: string; hint?: string; error?: string } & ComponentProps<'input'>) {
  const id = useId()
  const hintId = `${id}-dica`
  const errorId = `${id}-erro`
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy} className="mt-2" {...inputProps} />
      {hint && (
        <p id={hintId} className="mt-1.5 text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  )
}

export function FieldError({ id, children }: { id: string; children: string }) {
  return (
    <p id={id} className="mt-1.5 text-sm font-bold text-destructive">
      {children}
    </p>
  )
}

// Erro da API que não pertence a um campo (ex.: credenciais inválidas).
export function FormAlert({ children }: { children: string }) {
  return (
    <p role="alert" className="rounded-xl border-2 border-ink bg-[#ffe3e3] p-3.5 font-bold">
      {children}
    </p>
  )
}
