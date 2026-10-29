import { useId, type ComponentProps } from 'react'
import { Check } from 'lucide-react'
import { AVATAR_NAMES, avatarIdSchema } from '@/contracts'
import { FieldError } from '@/components/FormField'
import { UserAvatar } from '@/components/UserAvatar'
import { cn } from '@/lib/utils'

const AVATARS = avatarIdSchema.options

// Radios nativos dentro de um radiogroup: setas do teclado e formulário funcionam sem JS extra.
// `inputProps` vem do `register('avatar')` do react-hook-form.
export function AvatarPicker({ error, ...inputProps }: { error?: string } & Omit<ComponentProps<'input'>, 'type' | 'value'>) {
  const id = useId()
  const labelId = `${id}-rotulo`
  const errorId = `${id}-erro`

  return (
    <div>
      <p id={labelId} className="text-base leading-none font-bold">
        Avatar
      </p>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? true : undefined}
        className="mt-3 grid grid-cols-3 gap-2 min-[400px]:grid-cols-4 sm:grid-cols-5"
      >
        {AVATARS.map((avatar) => (
          <label
            key={avatar}
            className={cn(
              'group relative flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-ink p-1.5 text-center text-sm font-bold',
              'has-checked:bg-toon-yellow has-checked:shadow-toon-sm has-focus-visible:outline-3 has-focus-visible:outline-offset-3 has-focus-visible:outline-ring',
            )}
          >
            <input type="radio" value={avatar} aria-label={AVATAR_NAMES[avatar]} className="sr-only" {...inputProps} />
            <UserAvatar avatar={avatar} alt="" className="size-14" />
            <span aria-hidden="true">{AVATAR_NAMES[avatar]}</span>
            {/* Marca de escolhido: o estado não depende só da cor de fundo. */}
            <Check
              aria-hidden="true"
              strokeWidth={3}
              className="absolute top-1 right-1 hidden size-5 rounded-full bg-ink p-0.5 text-paper group-has-checked:block"
            />
          </label>
        ))}
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  )
}
