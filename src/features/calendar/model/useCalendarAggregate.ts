import { useQuery } from '@tanstack/react-query'
import { calendarKeys } from '@/shared/config'
import { calendarAggregateApi } from '../api/calendarAggregateApi'

export const useCalendarAggregate = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: calendarKeys.aggregate({ startDate, endDate }),
    queryFn: () => calendarAggregateApi.getAggregateData(startDate, endDate),
    enabled: !!startDate && !!endDate,
  })
}
