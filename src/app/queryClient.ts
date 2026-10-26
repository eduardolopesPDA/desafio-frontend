import { QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

const MAX_RETRIES = 2

// Só erro de rede ou 5xx merece nova tentativa; 4xx é definitivo (ARCHITECTURE.md §4).
function shouldRetry(failureCount: number, error: unknown) {
  if (failureCount >= MAX_RETRIES || !isAxiosError(error)) return false
  const status = error.response?.status
  return status === undefined || status >= 500
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: shouldRetry },
      mutations: { retry: false },
    },
  })
}
