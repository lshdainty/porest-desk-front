import { useQuery } from '@tanstack/react-query'
import { dashboardKeys } from '@/shared/config'
import { dashboardApi } from '../api/dashboardApi'

export const useDashboardSummary = () => {
  return useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: () => dashboardApi.getSummary(),
    refetchInterval: 60000,
    // 백그라운드(비활성 탭)에서는 폴링하지 않음 — 불필요한 요청 방지.
    refetchIntervalInBackground: false,
  })
}
