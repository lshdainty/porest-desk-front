import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'

export interface UpcomingEvent {
  rowId: number
  title: string
  eventType: string
  color: string
  startDate: string
  daysUntil: number
}

export interface RecentTodo {
  rowId: number
  title: string
  priority: string
  status: string
  dueDate: string | null
}

export interface DailyExpenseTrend {
  date: string
  income: number
  expense: number
}

export interface DashboardSummary {
  todoSummary: {
    totalCount: number
    pendingCount: number
    inProgressCount: number
    completedCount: number
    todayDueCount: number
    noteCount: number
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
  memoSummary: {
    totalCount: number
    pinnedCount: number
    recentMemoTitle: string | null
  }
  upcomingEvents: UpcomingEvent[]
  recentTodos: RecentTodo[]
  expenseTrend: DailyExpenseTrend[]
}

export interface LayoutResponse {
  dashboard: string | null
}

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const resp: ApiResponse<DashboardSummary> = await apiClient.get('/v1/dashboard/summary')
    return resp.data
  },

  getLayout: async (): Promise<LayoutResponse> => {
    const resp: ApiResponse<LayoutResponse> = await apiClient.get('/v1/dashboard/layout')
    return resp.data
  },

  updateLayout: async (dashboard: string): Promise<LayoutResponse> => {
    const resp: ApiResponse<LayoutResponse> = await apiClient.patch('/v1/dashboard/layout', { dashboard })
    return resp.data
  },
}
