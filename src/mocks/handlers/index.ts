import type { RequestHandler, WebSocketHandler } from 'msw'

// Um arquivo por recurso REST; cada um é registrado aqui.
export const handlers: Array<RequestHandler | WebSocketHandler> = []
