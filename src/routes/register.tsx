import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { registerRequestSchema, type RegisterRequest } from '@/contracts'
import { FormAlert, TextField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { AuthCard } from '@/features/auth/components/AuthCard'
import { redirectSearchSchema } from '@/features/auth/authSearch'
import { AvatarPicker } from '@/features/auth/components/AvatarPicker'
import { apiFieldErrors } from '@/features/auth/formErrors'
import { sessionQuery, useRegister } from '@/features/auth/queries'
import { errorMessage } from '@/lib/http'

export const Route = createFileRoute('/register')({
  validateSearch: redirectSearchSchema,
  // Já logado (ex.: voltou pelo histórico): segue direto para o destino.
  beforeLoad: async ({ context: { queryClient }, search }) => {
    const session = await queryClient.ensureQueryData(sessionQuery())
    if (session) throw redirect({ href: search.redirect ?? '/', replace: true })
  },
  head: () => ({ meta: [{ title: 'Criar Toon Pass | CN Toon Vault' }] }),
  component: RegisterPage,
})

const FIELDS = ['name', 'email', 'password', 'avatar'] as const
// Finn já escolhido: o avatar nunca fica vazio e pode ser trocado depois.
const DEFAULTS: RegisterRequest = { name: '', email: '', password: '', avatar: 'finn' }

function RegisterPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const registration = useRegister()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(registerRequestSchema), defaultValues: DEFAULTS })

  const onSubmit = handleSubmit((values) =>
    registration.mutate(values, {
      onSuccess: () => navigate({ href: search.redirect ?? '/', replace: true }),
      // 409 EMAIL_TAKEN chega em `fields.email` e aparece no próprio campo.
      onError: (error) => {
        for (const [name, message] of apiFieldErrors(error, FIELDS)) setError(name, { message }, { shouldFocus: true })
      },
    }),
  )
  const formError =
    registration.isError && apiFieldErrors(registration.error, FIELDS).length === 0
      ? errorMessage(registration.error)
      : null

  return (
    <AuthCard
      title="Criar Toon Pass"
      footer={
        <Link to="/login" search={{ redirect: search.redirect }} className="rounded-md font-bold underline decoration-2 underline-offset-4">
          Já tenho Toon Pass
        </Link>
      }
    >
      <form noValidate onSubmit={onSubmit} className="mt-6 grid gap-5">
        <TextField label="Nome" autoComplete="name" error={errors.name?.message} {...register('name')} />
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <TextField
          label="Senha"
          type="password"
          autoComplete="new-password"
          hint="Mínimo de 8 caracteres, com ao menos uma letra e um número."
          error={errors.password?.message}
          {...register('password')}
        />
        <AvatarPicker error={errors.avatar?.message} {...register('avatar')} />
        {formError && <FormAlert>{formError}</FormAlert>}
        <Button type="submit" size="lg" disabled={registration.isPending} className="w-full">
          Criar Toon Pass
        </Button>
      </form>
    </AuthCard>
  )
}
