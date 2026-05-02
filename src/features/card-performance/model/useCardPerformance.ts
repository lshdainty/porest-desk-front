import { useQuery } from '@tanstack/react-query'
import { cardKeys } from '@/shared/config'
import { cardPerformanceApi } from '../api/cardPerformanceApi'

export const useCardPerformance = (assetRowId: number | null, yearMonth: string) => {
  return useQuery({
    queryKey: cardKeys.performance(assetRowId ?? 0, yearMonth),
    queryFn: () => cardPerformanceApi.getPerformance(assetRowId!, yearMonth),
    enabled: assetRowId != null && assetRowId > 0 && /^\d{4}-\d{2}$/.test(yearMonth),
  })
}
