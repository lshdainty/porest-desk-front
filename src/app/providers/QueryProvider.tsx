import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { ReactNode } from 'react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 마운트/리마운트/포커스마다 전 쿼리 재요청되어 요청 폭주 → 60초 신선도로 억제.
      staleTime: 60_000,
      // 포커스 복귀마다 전 쿼리 재요청 방지(전역 off). 실시간성 필요 쿼리는 개별 refetchInterval 로 처리.
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export const QueryProvider = ({ children }: { children: ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
