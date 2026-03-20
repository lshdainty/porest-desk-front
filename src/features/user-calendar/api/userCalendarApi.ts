import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { UserCalendar, UserCalendarFormValues } from '@/entities/user-calendar'

/**
 * 백엔드 API 응답의 UserCalendar를 프론트엔드 타입으로 변환
 * - isDefault: "Y"/"N" → boolean
 * - isVisible: "Y"/"N" → boolean
 */
function fromApiCalendar(cal: Record<string, unknown>): UserCalendar {
  return {
    ...cal,
    isDefault: cal.isDefault === 'Y' || cal.isDefault === true,
    isVisible: cal.isVisible === 'Y' || cal.isVisible === true,
  } as UserCalendar
}

export const userCalendarApi = {
  getCalendars: async (): Promise<UserCalendar[]> => {
    const resp: ApiResponse<{ calendars: UserCalendar[] }> = await apiClient.get('/v1/calendar/calendars')
    return (resp.data.calendars as unknown as Record<string, unknown>[]).map(fromApiCalendar)
  },

  createCalendar: async (data: UserCalendarFormValues): Promise<UserCalendar> => {
    const resp: ApiResponse<UserCalendar> = await apiClient.post('/v1/calendar/calendars', data)
    return fromApiCalendar(resp.data as unknown as Record<string, unknown>)
  },

  updateCalendar: async (id: number, data: UserCalendarFormValues): Promise<UserCalendar> => {
    const resp: ApiResponse<UserCalendar> = await apiClient.put(`/v1/calendar/calendars/${id}`, data)
    return fromApiCalendar(resp.data as unknown as Record<string, unknown>)
  },

  toggleVisibility: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.patch(`/v1/calendar/calendars/${id}/visibility`)
    return resp.data
  },

  deleteCalendar: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/calendar/calendars/${id}`)
    return resp.data
  },
}
