import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { CalendarEvent, CalendarEventFormValues } from '@/entities/calendar'

/**
 * 백엔드 YNType("Y"/"N") → boolean 변환
 */
export function ynToBoolean(value: unknown): boolean {
  return value === 'Y' || value === true
}

/**
 * 백엔드 API 응답의 CalendarEvent를 프론트엔드 타입으로 변환
 * - isAllDay: "Y"/"N" → boolean
 * - isException: "Y"/"N" → boolean
 */
export function fromApiEvent(event: Record<string, unknown>): CalendarEvent {
  return {
    ...event,
    isAllDay: ynToBoolean(event.isAllDay),
    isException: ynToBoolean(event.isException),
  } as CalendarEvent
}

/**
 * CalendarEventFormValues를 백엔드 API 형식으로 변환
 * - isAllDay: boolean → "Y"/"N" (YNType)
 * - startDate/endDate: "yyyy-MM-dd" → "yyyy-MM-ddTHH:mm:ss" (LocalDateTime)
 */
function toApiPayload(data: CalendarEventFormValues) {
  const isAllDay = data.isAllDay

  // 날짜에 시간 컴포넌트가 없으면 추가
  const formatDate = (dateStr: string, isStart: boolean) => {
    if (dateStr.includes('T')) {
      // datetime-local input gives "yyyy-MM-ddTHH:mm", backend needs seconds
      if (dateStr.length === 16) return `${dateStr}:00`
      return dateStr
    }
    return isAllDay
      ? `${dateStr}T${isStart ? '00:00:00' : '23:59:59'}`
      : `${dateStr}T${isStart ? '09:00:00' : '10:00:00'}`
  }

  return {
    ...data,
    isAllDay: isAllDay ? 'Y' : 'N',
    startDate: formatDate(data.startDate, true),
    endDate: formatDate(data.endDate, false),
  }
}

export const calendarApi = {
  createEvent: async (data: CalendarEventFormValues): Promise<CalendarEvent> => {
    const resp: ApiResponse<CalendarEvent> = await apiClient.post('/v1/calendar/event', toApiPayload(data))
    return fromApiEvent(resp.data as unknown as Record<string, unknown>)
  },

  getEvents: async (startDate: string, endDate: string): Promise<CalendarEvent[]> => {
    // 백엔드는 LocalDateTime(ISO.DATE_TIME) 형식을 기대하므로 시간 부분 추가
    const startDateTime = startDate.includes('T') ? startDate : `${startDate}T00:00:00`
    const endDateTime = endDate.includes('T') ? endDate : `${endDate}T23:59:59`
    const resp: ApiResponse<{ events: CalendarEvent[] }> = await apiClient.get('/v1/calendar/events', {
      params: { startDate: startDateTime, endDate: endDateTime },
    })
    return (resp.data.events as unknown as Record<string, unknown>[]).map(fromApiEvent)
  },

  updateEvent: async (id: number, data: CalendarEventFormValues): Promise<CalendarEvent> => {
    const resp: ApiResponse<CalendarEvent> = await apiClient.put(`/v1/calendar/event/${id}`, toApiPayload(data))
    return fromApiEvent(resp.data as unknown as Record<string, unknown>)
  },

  deleteEvent: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/calendar/event/${id}`)
    return resp.data
  },
}
