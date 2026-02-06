import { useQuery } from '@tanstack/react-query'
import { dashboardKeys } from '@/shared/config'
import { dashboardApi } from '../api/dashboardApi'

export const useDashboardSummary = () => {
  return useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: () => dashboardApi.getSummary(),
    refetchInterval: 60000,
  })
}
