import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { Holiday, HolidayType } from '@/entities/calendar'

/**
 * 백엔드 YNType("Y"/"N") → boolean 변환
 */
function ynToBoolean(value: unknown): boolean {
  return value === 'Y' || value === true
}

/**
 * 백엔드 API 응답의 Holiday를 프론트엔드 타입으로 변환
 * - isRecurring: "Y"/"N" → boolean
 */
function fromApiHoliday(holiday: Record<string, unknown>): Holiday {
  return {
    ...holiday,
    isRecurring: ynToBoolean(holiday.isRecurring),
  } as Holiday
}

export interface HolidayFormValues {
  holidayDate: string  // 'yyyy-MM-dd'
  holidayName: string
  holidayType: HolidayType
  isRecurring: boolean
}

/**
 * HolidayFormValues를 백엔드 API 형식으로 변환
 * - isRecurring: boolean → "Y"/"N" (YNType)
 */
function toApiPayload(data: HolidayFormValues) {
  return {
    ...data,
    isRecurring: data.isRecurring ? 'Y' : 'N',
  }
}

export const holidayApi = {
  getHolidays: async (startDate: string, endDate: string): Promise<Holiday[]> => {
    const resp: ApiResponse<{ holidays: Holiday[] }> = await apiClient.get('/v1/holidays', {
      params: { startDate, endDate },
    })
    return (resp.data.holidays as unknown as Record<string, unknown>[]).map(fromApiHoliday)
  },

  createHoliday: async (data: HolidayFormValues): Promise<Holiday> => {
    const resp: ApiResponse<Holiday> = await apiClient.post('/v1/holiday', toApiPayload(data))
    return fromApiHoliday(resp.data as Record<string, unknown>)
  },

  updateHoliday: async (id: number, data: HolidayFormValues): Promise<Holiday> => {
    const resp: ApiResponse<Holiday> = await apiClient.put(`/v1/holiday/${id}`, toApiPayload(data))
    return fromApiHoliday(resp.data as Record<string, unknown>)
  },

  deleteHoliday: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/holiday/${id}`)
    return resp.data
  },
}
