import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { TimerSession, TimerSessionFormValues } from '@/entities/timer'

export interface TimerSessionListParams {
  timerType?: string
  startDate?: string
  endDate?: string
}

export interface TimerDailyStatsParams {
  startDate: string
  endDate: string
}

export interface TimerDailyStat {
  date: string
  totalSeconds: number
  sessionCount: number
}

export const timerApi = {
  createSession: async (data: TimerSessionFormValues): Promise<TimerSession> => {
    const resp: ApiResponse<TimerSession> = await apiClient.post('/v1/timers/sessions', data)
    return resp.data
  },

  getSessions: async (params?: TimerSessionListParams): Promise<TimerSession[]> => {
    const resp: ApiResponse<TimerSession[]> = await apiClient.get('/v1/timers/sessions', { params })
    return resp.data
  },

  getDailyStats: async (params: TimerDailyStatsParams): Promise<TimerDailyStat[]> => {
    const resp: ApiResponse<TimerDailyStat[]> = await apiClient.get('/v1/timers/daily-stats', { params })
    return resp.data
  },

  deleteSession: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/timers/sessions/${id}`)
    return resp.data
  },
}
