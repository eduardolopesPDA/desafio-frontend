import { http, HttpResponse } from 'msw'
import type { z } from 'zod'
import type { ApiErrorBody, ApiErrorCode } from '@/contracts'
import { persist } from './db'
import { simulateNetwork } from './scenarios'

export const API_URL: string = import.meta.env.VITE_API_URL ?? '/api'

// Lançado pelos handlers e convertido no corpo de erro do contrato pelo `route`.
export class MockError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message)
  }
}

function errorResponse(status: number, code: ApiErrorCode, message: string, fields?: Record<string, string>) {
  const body: ApiErrorBody = { error: { code, message, ...(fields && { fields }) } }
  return HttpResponse.json(body, { status })
}

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete'
type Resolver = (info: { request: Request; params: Record<string, string> }) => Response | Promise<Response>

// Todo handler passa por aqui: latência e falhas do cenário, erros padronizados e persistência.
export function route(method: Method, path: string, resolver: Resolver) {
  const key = `${method.toUpperCase()} ${path}`
  return http[method](`${API_URL}${path}`, async ({ request, params }) => {
    const failure = await simulateNetwork(key)
    if (failure) {
      return 'networkError' in failure ? HttpResponse.error() : errorResponse(failure.status, failure.code, failure.message)
    }
    try {
      return await resolver({ request, params: params as Record<string, string> })
    } catch (error) {
      if (error instanceof MockError) return errorResponse(error.status, error.code, error.message, error.fields)
      throw error
    } finally {
      if (method !== 'get') persist()
    }
  })
}

export async function parseBody<T extends z.ZodType>(request: Request, schema: T): Promise<z.output<T>> {
  const result = schema.safeParse(await request.json().catch(() => undefined))
  if (result.success) return result.data

  // Primeira mensagem de cada campo, com o caminho em notação de ponto ("collector.email").
  const fields: Record<string, string> = {}
  for (const issue of result.error.issues) fields[issue.path.join('.') || 'body'] ??= issue.message
  throw new MockError(422, 'VALIDATION_ERROR', 'Confira os campos destacados.', fields)
}

export function notFound(message = 'Recurso não encontrado.'): never {
  throw new MockError(404, 'NOT_FOUND', message)
}

export const noContent = () => new HttpResponse(null, { status: 204 })
