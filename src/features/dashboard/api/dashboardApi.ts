import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'

export interface DashboardSummary {
  todoSummary: {
    totalCount: number
    pendingCount: number
    inProgressCount: number
    completedCount: number
    todayDueCount: number
  }
  calendarSummary: {
    todayEventCount: number
    upcomingEventCount: number
    nextEventDate: string | null
  }
  expenseSummary: {
    todayIncome: number
    todayExpense: number
    monthlyIncome: number
    monthlyExpense: number
  }
  timerSummary: {
    todayFocusSeconds: number
    todaySessionCount: number
    weeklyFocusSeconds: number
  }
  memoSummary: {
    totalCount: number
    pinnedCount: number
    recentMemoTitle: string | null
  }
}

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const resp: ApiResponse<DashboardSummary> = await apiClient.get('/v1/dashboard/summary')
    return resp.data
  },
}
