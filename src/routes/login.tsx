import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { loginRequestSchema } from '@/contracts'
import { FormAlert, TextField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { AuthCard } from '@/features/auth/components/AuthCard'
import { loginSearchSchema } from '@/features/auth/authSearch'
import { apiFieldErrors } from '@/features/auth/formErrors'
import { sessionQuery, useLogin } from '@/features/auth/queries'
import { errorMessage } from '@/lib/http'

export const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema,
  // Já logado (ex.: voltou pelo histórico): segue direto para o destino.
  beforeLoad: async ({ context: { queryClient }, search }) => {
    const session = await queryClient.ensureQueryData(sessionQuery())
    if (session) throw redirect({ href: search.redirect ?? '/', replace: true })
  },
  head: () => ({ meta: [{ title: 'Entrar | CN Toon Vault' }] }),
  component: LoginPage,
})

const FIELDS = ['email', 'password'] as const

function LoginPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const login = useLogin()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginRequestSchema), defaultValues: { email: '', password: '' } })

  const onSubmit = handleSubmit((values) =>
    login.mutate(values, {
      // `replace`: o /login não fica no histórico.
      onSuccess: () => navigate({ href: search.redirect ?? '/', replace: true }),
      onError: (error) => {
        for (const [name, message] of apiFieldErrors(error, FIELDS)) setError(name, { message }, { shouldFocus: true })
      },
    }),
  )
  const formError = login.isError && apiFieldErrors(login.error, FIELDS).length === 0 ? errorMessage(login.error) : null

  return (
    <AuthCard
      title="Entrar com seu Toon Pass"
      footer={
        <>
          Primeira vez no Toon Vault?{' '}
          <Link to="/register" search={{ redirect: search.redirect }} className="rounded-md font-bold underline decoration-2 underline-offset-4">
            Criar Toon Pass
          </Link>
        </>
      }
    >
      {search.reason === 'expired' && (
        <p role="status" className="mt-4 rounded-xl border-2 border-ink bg-accent p-3.5 font-bold">
          Sua sessão expirou. Entre novamente para continuar.
        </p>
      )}
      <form noValidate onSubmit={onSubmit} className="mt-6 grid gap-5">
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
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        {formError && <FormAlert>{formError}</FormAlert>}
        <Button type="submit" size="lg" disabled={login.isPending} className="w-full">
          Entrar
        </Button>
      </form>
    </AuthCard>
  )
}
