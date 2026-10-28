import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/http'

const MAX_RETRIES = 2

// Só falha transitória (rede, timeout, 5xx) merece nova tentativa; 4xx é definitivo (ARCHITECTURE.md §4).
function shouldRetry(failureCount: number, error: unknown) {
  return failureCount < MAX_RETRIES && error instanceof ApiError && error.isTransient
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: shouldRetry },
      mutations: { retry: false },
    },
  })
}
