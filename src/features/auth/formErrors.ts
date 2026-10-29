import { ApiError } from '@/lib/http'

// Erros por campo que a API devolveu (ex.: 409 EMAIL_TAKEN em `fields.email`), só dos campos do formulário.
export function apiFieldErrors<K extends string>(error: unknown, names: readonly K[]): [K, string][] {
  if (!(error instanceof ApiError) || !error.fields) return []
  const fields = error.fields
  return names.flatMap((name) => (fields[name] ? [[name, fields[name]] as [K, string]] : []))
}
