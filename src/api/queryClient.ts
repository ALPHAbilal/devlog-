import { QueryClient } from '@tanstack/react-query'

/**
 * QueryClient - The centralized "brain" of all data fetching
 *
 * This single instance manages:
 * - Query caching across all components
 * - Background refetching coordination
 * - Garbage collection of stale data
 * - Retry logic for failed requests
 * - Data synchronization
 *
 * IMPORTANT: Create ONE instance, share via QueryClientProvider
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data freshness
      staleTime: 1000 * 60 * 5,     // 5 minutes - matches our document save debounce philosophy
      gcTime: 1000 * 60 * 10,       // 10 minutes - keep in cache after becoming inactive

      // Refetch behavior
      refetchOnWindowFocus: true,   // Sync when user returns to tab
      refetchOnReconnect: true,     // Sync when network reconnects
      refetchOnMount: true,         // Sync when component mounts

      // Retry logic (exponential backoff)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Network mode
      networkMode: 'offlineFirst',  // Works with our IndexedDB fallback
    },
    mutations: {
      // Mutations retry once (they're already retried by storage layer)
      retry: 1,
      retryDelay: 1000,

      // Network mode for mutations
      networkMode: 'offlineFirst',
    },
  },
})

// Export for use in non-React contexts (services, utilities)
export default queryClient
