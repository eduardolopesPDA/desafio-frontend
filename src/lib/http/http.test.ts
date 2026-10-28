import { afterEach, describe, expect, it } from 'vitest'
import { AxiosError, CanceledError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { ApiError, http, setAccessToken, toApiError } from '.'

// Adapter falso: a requisição passa pelos interceptors reais sem tocar a rede.
function reply(status: number, data: unknown): AxiosAdapter {
  return async (config) => {
    const response: AxiosResponse = { status, statusText: '', data, headers: {}, config }
    if (status < 400) return response
    throw new AxiosError('falha', AxiosError.ERR_BAD_RESPONSE, config, {}, response)
  }
}

function fail(code: string): AxiosAdapter {
  return async (config) => {
    throw new AxiosError('falha', code, config)
  }
}

afterEach(() => setAccessToken(null))

describe('toApiError', () => {
  it('lê código, mensagem e campos do corpo de erro do contrato', async () => {
    const body = { error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos', fields: { email: 'Obrigatório' } } }
    const error = await http.get('/x', { adapter: reply(422, body) }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ code: 'VALIDATION_ERROR', status: 422, message: 'Dados inválidos', fields: { email: 'Obrigatório' } })
  })

  it('marca corpo fora do contrato como UNKNOWN, preservando o status', () => {
    const config = { headers: {} } as InternalAxiosRequestConfig
    const response: AxiosResponse = { status: 500, statusText: '', data: '<html>', headers: {}, config }
    const error = toApiError(new AxiosError('falha', AxiosError.ERR_BAD_RESPONSE, config, {}, response))

    expect(error).toMatchObject({ code: 'UNKNOWN', status: 500 })
  })

  it('distingue timeout de falta de conexão', async () => {
    const timeout = await http.get('/x', { adapter: fail(AxiosError.ECONNABORTED) }).catch((e: unknown) => e)
    const offline = await http.get('/x', { adapter: fail(AxiosError.ERR_NETWORK) }).catch((e: unknown) => e)

    expect(timeout).toMatchObject({ code: 'TIMEOUT', status: undefined })
    expect(offline).toMatchObject({ code: 'NETWORK_ERROR', status: undefined })
  })

  it('deixa cancelamentos passarem sem conversão', async () => {
    const adapter: AxiosAdapter = async (config) => {
      throw new CanceledError(undefined, undefined, config)
    }
    const error = await http.get('/x', { adapter }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(CanceledError)
  })
})

describe('isTransient', () => {
  it('vale para rede, timeout e 5xx, mas não para 4xx', () => {
    expect(new ApiError('NETWORK_ERROR', '').isTransient).toBe(true)
    expect(new ApiError('TIMEOUT', '').isTransient).toBe(true)
    expect(new ApiError('NETWORK_UNAVAILABLE', '', 503).isTransient).toBe(true)
    expect(new ApiError('SOLD_OUT', '', 409).isTransient).toBe(false)
  })
})

describe('Authorization', () => {
  it('envia o token da sessão e para de enviar após limpar', async () => {
    let header: unknown
    const adapter: AxiosAdapter = async (config) => {
      header = config.headers.Authorization
      return reply(200, {})(config)
    }

    setAccessToken('abc')
    await http.get('/x', { adapter })
    expect(header).toBe('Bearer abc')

    setAccessToken(null)
    await http.get('/x', { adapter })
    expect(header).toBeUndefined()
  })
})
