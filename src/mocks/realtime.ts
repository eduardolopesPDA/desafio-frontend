import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import { SOCKET_EVENTS, type NftUpdatedEvent, type OrderUpdatedEvent } from '@/contracts'
import type { NftRecord, OrderRecord } from './db'
import { isScenario } from './scenarios'
import { findSessionUser } from './session'

// O socket.io-client (transporte websocket) abre <origem>/socket.io/?EIO=4&transport=websocket.
// O MSW tira o prefixo /socket.io/ e a query antes de comparar, sobrando "ws://<host>/".
// Vale para qualquer origem: web e extensão.
const socketServer = ws.link(/^wss?:\/\/[^/]+\/$/)

type Client = { io: ReturnType<typeof toSocketIo>; userId: string | null; close: () => void }

const clients = new Set<Client>()
// Engine.IO derruba a conexão sem ping do servidor (pingInterval 25 s + pingTimeout 5 s).
const PING_INTERVAL_MS = 20_000
let refuseUntil = 0

export const realtimeHandler = socketServer.addEventListener('connection', (connection) => {
  // Durante uma queda simulada, recusa as tentativas de reconexão.
  if (Date.now() < refuseUntil) {
    connection.client.close()
    return
  }

  const client: Client = { io: toSocketIo(connection), userId: null, close: () => connection.client.close() }
  clients.add(client)

  connection.client.addEventListener('message', (event) => {
    // Pacote CONNECT do Socket.IO: "40" seguido do JSON de `auth` ({ token }).
    if (typeof event.data === 'string' && event.data.startsWith('40')) client.userId = userIdFromAuth(event.data.slice(2))
  })

  const ping = setInterval(() => connection.client.send('2'), PING_INTERVAL_MS)
  connection.client.addEventListener('close', () => {
    clearInterval(ping)
    clients.delete(client)
  })
})

function userIdFromAuth(raw: string) {
  try {
    const { token } = JSON.parse(raw) as { token?: unknown }
    if (typeof token !== 'string') return null
    const result = findSessionUser(token)
    return 'user' in result ? result.user.id : null
  } catch {
    return null
  }
}

// Último evento por recurso, para o cenário `duplicate-events` reenviar uma versão antiga.
const lastEvents = new Map<string, unknown>()

function emit(event: string, payload: { eventId: string }, resource: string, targets: Client[]) {
  const previous = lastEvents.get(resource)
  lastEvents.set(resource, payload)
  const sequence = isScenario('duplicate-events') ? [payload, payload, ...(previous ? [previous] : [])] : [payload]
  for (const target of targets) for (const item of sequence) target.io.client.emit(event, item)
}

// Preço e tiragem são públicos: todos os clientes, inclusive visitantes.
export function emitNftUpdated(nft: NftRecord) {
  const payload: NftUpdatedEvent = {
    eventId: crypto.randomUUID(),
    nftId: nft.id,
    version: nft.version,
    price: nft.price,
    available: nft.editions.reduce((total, edition) => total + edition.available, 0),
    editions: nft.editions.map(({ id, available }) => ({ id, available })),
  }
  emit(SOCKET_EVENTS.nftUpdated, payload, `nft:${nft.id}`, [...clients])
}

// Pedido é privado: só as conexões autenticadas como o dono.
export function emitOrderUpdated({ order, userId }: OrderRecord) {
  const payload: OrderUpdatedEvent = {
    eventId: crypto.randomUUID(),
    orderId: order.id,
    version: order.version,
    status: order.status,
    reason: order.reason,
  }
  const owners = [...clients].filter((client) => client.userId === userId)
  emit(SOCKET_EVENTS.orderUpdated, payload, `order:${order.id}`, owners)
}

// Derruba todas as conexões e recusa reconexões por `downForMs`.
export function disconnectSockets(downForMs = 0) {
  refuseUntil = Date.now() + downForMs
  for (const client of clients) client.close()
}
