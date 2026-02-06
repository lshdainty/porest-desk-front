import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { CalendarAggregateData } from '@/entities/calendar'

export const calendarAggregateApi = {
  getAggregateData: async (startDate: string, endDate: string): Promise<CalendarAggregateData> => {
    const resp: ApiResponse<CalendarAggregateData> = await apiClient.get('/v1/calendar/aggregate', {
      params: { startDate, endDate },
    })
    return resp.data
  },
}
