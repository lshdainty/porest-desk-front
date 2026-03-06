import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { CalendarAggregateData } from '@/entities/calendar'
import { ynToBoolean } from './calendarApi'

export const calendarAggregateApi = {
  getAggregateData: async (startDate: string, endDate: string): Promise<CalendarAggregateData> => {
    const resp: ApiResponse<CalendarAggregateData> = await apiClient.get('/v1/calendar/aggregate', {
      params: { startDate, endDate },
    })
    return {
      ...resp.data,
      events: (resp.data as any).events.map((event: any) => ({
        ...event,
        isAllDay: ynToBoolean(event.isAllDay),
        isException: ynToBoolean(event.isException),
      })),
    }
  },
}
