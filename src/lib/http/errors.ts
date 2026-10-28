import { isAxiosError } from 'axios'
import { apiErrorBodySchema, type ApiErrorCode } from '@/contracts'

// Além dos códigos da API, falhas que só o cliente enxerga (sem resposta ou resposta fora do contrato).
export type HttpErrorCode = ApiErrorCode | 'NETWORK_ERROR' | 'TIMEOUT' | 'UNKNOWN'

export class ApiError extends Error {
  override readonly name = 'ApiError'

  constructor(
    readonly code: HttpErrorCode,
    message: string,
    readonly status?: number,
    readonly fields?: Record<string, string>,
    options?: { cause?: unknown },
  ) {
    super(message, options)
  }

  // Falha que pode passar sozinha: rede, timeout ou 5xx (ARCHITECTURE.md §4).
  get isTransient() {
    return this.code === 'NETWORK_ERROR' || this.code === 'TIMEOUT' || (this.status ?? 0) >= 500
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (!isAxiosError(error)) return new ApiError('UNKNOWN', 'Erro inesperado.', undefined, undefined, { cause: error })

  const { response } = error
  if (response) {
    const body = apiErrorBodySchema.safeParse(response.data)
    if (!body.success) {
      return new ApiError('UNKNOWN', 'Resposta inesperada do servidor.', response.status, undefined, { cause: error })
    }
    const { code, message, fields } = body.data.error
    return new ApiError(code, message, response.status, fields, { cause: error })
  }

  // ETIMEDOUT aparece quando `transitional.clarifyTimeoutError` está ligado.
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new ApiError('TIMEOUT', 'O servidor demorou demais para responder.', undefined, undefined, { cause: error })
  }
  return new ApiError('NETWORK_ERROR', 'Sem conexão com o servidor.', undefined, undefined, { cause: error })
}
