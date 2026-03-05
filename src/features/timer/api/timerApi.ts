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
    const resp: ApiResponse<TimerSession> = await apiClient.post('/v1/timer/session', data)
    return resp.data
  },

  getSessions: async (params?: TimerSessionListParams): Promise<TimerSession[]> => {
    const resp: ApiResponse<{ sessions: TimerSession[] }> = await apiClient.get('/v1/timer/sessions', { params })
    return resp.data.sessions
  },

  getDailyStats: async (params: TimerDailyStatsParams): Promise<TimerDailyStat[]> => {
    const resp: ApiResponse<{ sessions: TimerSession[] }> = await apiClient.get('/v1/timer/sessions/daily-stats', { params })
    const sessions = resp.data.sessions

    const statsMap = new Map<string, { totalSeconds: number; sessionCount: number }>()
    for (const session of sessions) {
      const date = session.startTime.split('T')[0]
      const existing = statsMap.get(date)
      if (existing) {
        existing.totalSeconds += session.durationSeconds
        existing.sessionCount += 1
      } else {
        statsMap.set(date, { totalSeconds: session.durationSeconds, sessionCount: 1 })
      }
    }

    return Array.from(statsMap.entries())
      .map(([date, stat]) => ({ date, ...stat }))
      .sort((a, b) => a.date.localeCompare(b.date))
  },

  deleteSession: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/timer/session/${id}`)
    return resp.data
  },
}
