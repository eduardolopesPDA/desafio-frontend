import { afterEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, CanceledError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { ApiError, http, onUnauthorized, setAccessToken, toApiError } from '.'

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

let removeHandler = () => {}

afterEach(() => {
  setAccessToken(null)
  removeHandler()
})

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

describe('onUnauthorized', () => {
  const expired = { error: { code: 'SESSION_EXPIRED', message: 'Sua sessão expirou.' } }

  // Adapter que só responde quando o teste manda: permite várias requisições em voo ao mesmo tempo.
  function pendingReply() {
    const pending: Array<() => void> = []
    const adapter: AxiosAdapter = (config) =>
      new Promise((resolve, reject) => {
        pending.push(() => reply(401, expired)(config).then(resolve, reject))
      })
    return {
      adapter,
      // Os interceptors rodam de forma assíncrona: espera as requisições chegarem ao adapter.
      arrived: (count: number) => vi.waitFor(() => expect(pending).toHaveLength(count)),
      respond: () => pending.splice(0).forEach((respond) => respond()),
    }
  }

  it('avisa no 401 de sessão de uma requisição com o token atual, e o erro continua rejeitado', async () => {
    const handler = vi.fn()
    removeHandler = onUnauthorized(handler)
    setAccessToken('abc')

    const error = await http.get('/x', { adapter: reply(401, expired) }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ code: 'SESSION_EXPIRED', status: 401 })
    expect(handler).toHaveBeenCalledOnce()
    expect(handler).toHaveBeenCalledWith(error)
  })

  it('vale para UNAUTHENTICATED, mas não para outros 401 nem para requisições sem token', async () => {
    const handler = vi.fn()
    removeHandler = onUnauthorized(handler)
    const invalid = { error: { code: 'UNAUTHENTICATED', message: 'Sessão inválida.' } }
    const credentials = { error: { code: 'INVALID_CREDENTIALS', message: 'E-mail ou senha incorretos.' } }

    await http.get('/x', { adapter: reply(401, invalid) }).catch(() => {})
    expect(handler).not.toHaveBeenCalled()

    setAccessToken('abc')
    await http.post('/auth/login', {}, { adapter: reply(401, credentials) }).catch(() => {})
    expect(handler).not.toHaveBeenCalled()

    await http.get('/x', { adapter: reply(401, invalid) }).catch(() => {})
    expect(handler).toHaveBeenCalledOnce()
  })

  it('respeita skipUnauthorizedHandler', async () => {
    const handler = vi.fn()
    removeHandler = onUnauthorized(handler)
    setAccessToken('abc')

    await http.get('/auth/session', { adapter: reply(401, expired), skipUnauthorizedHandler: true }).catch(() => {})

    expect(handler).not.toHaveBeenCalled()
  })

  it('avisa uma vez quando várias requisições expiram juntas e o handler limpa o token', async () => {
    const handler = vi.fn(() => setAccessToken(null))
    removeHandler = onUnauthorized(handler)
    setAccessToken('abc')
    const { adapter, arrived, respond } = pendingReply()

    const requests = [http.get('/a', { adapter }), http.get('/b', { adapter }), http.get('/c', { adapter })]
    await arrived(3)
    respond()
    const results = await Promise.allSettled(requests)

    expect(results.every((r) => r.status === 'rejected' && r.reason instanceof ApiError)).toBe(true)
    expect(handler).toHaveBeenCalledOnce()
  })

  it('ignora o 401 atrasado de uma sessão que já foi trocada', async () => {
    const handler = vi.fn()
    removeHandler = onUnauthorized(handler)
    setAccessToken('antigo')
    const { adapter, arrived, respond } = pendingReply()

    const request = http.get('/x', { adapter })
    await arrived(1)
    setAccessToken('novo')
    respond()
    await request.catch(() => {})

    expect(handler).not.toHaveBeenCalled()
  })
})
