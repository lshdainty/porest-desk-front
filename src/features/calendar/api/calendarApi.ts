import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { CalendarEvent, CalendarEventFormValues } from '@/entities/calendar'

export const calendarApi = {
  createEvent: async (data: CalendarEventFormValues): Promise<CalendarEvent> => {
    const resp: ApiResponse<CalendarEvent> = await apiClient.post('/v1/calendar/event', data)
    return resp.data
  },

  getEvents: async (startDate: string, endDate: string): Promise<CalendarEvent[]> => {
    const resp: ApiResponse<{ events: CalendarEvent[] }> = await apiClient.get('/v1/calendar/events', {
      params: { startDate, endDate },
    })
    return resp.data.events
  },

  updateEvent: async (id: number, data: CalendarEventFormValues): Promise<CalendarEvent> => {
    const resp: ApiResponse<CalendarEvent> = await apiClient.put(`/v1/calendar/event/${id}`, data)
    return resp.data
  },

  deleteEvent: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/calendar/event/${id}`)
    return resp.data
  },
}
