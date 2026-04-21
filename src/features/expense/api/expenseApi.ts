import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type {
  Expense,
  ExpenseFormValues,
  DailySummary,
  MonthlySummary,
  MonthlyTrend,
  WeeklySummary,
  YearlySummary,
  MerchantSummary,
  AssetExpenseSummary,
  HeatmapCell,
} from '@/entities/expense'

export interface ExpenseListParams {
  expenseType?: string
  categoryId?: number
  startDate?: string
  endDate?: string
}

export interface ExpenseSearchParams {
  categoryId?: number
  assetId?: number
  expenseType?: string
  keyword?: string
  merchant?: string
  minAmount?: number
  maxAmount?: number
  startDate?: string
  endDate?: string
}

export const expenseApi = {
  createExpense: async (data: ExpenseFormValues): Promise<Expense> => {
    const resp: ApiResponse<Expense> = await apiClient.post('/v1/expense', data)
    return resp.data
  },

  getExpenses: async (params?: ExpenseListParams): Promise<Expense[]> => {
    const resp: ApiResponse<{ expenses: Expense[] }> = await apiClient.get('/v1/expenses', { params })
    return resp.data.expenses
  },

  updateExpense: async (id: number, data: ExpenseFormValues): Promise<Expense> => {
    const resp: ApiResponse<Expense> = await apiClient.put(`/v1/expense/${id}`, data)
    return resp.data
  },

  deleteExpense: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/expense/${id}`)
    return resp.data
  },

  getDailySummary: async (date: string): Promise<DailySummary> => {
    const resp: ApiResponse<DailySummary> = await apiClient.get('/v1/expenses/summary/daily', { params: { date } })
    return resp.data
  },

  getMonthlySummary: async (year: number, month: number): Promise<MonthlySummary> => {
    const resp: ApiResponse<MonthlySummary> = await apiClient.get('/v1/expenses/summary/monthly', { params: { year, month } })
    return resp.data
  },

  getMonthlyTrend: async (months = 6): Promise<MonthlyTrend[]> => {
    const resp: ApiResponse<{ trends: MonthlyTrend[] }> = await apiClient.get('/v1/expenses/summary/trend', { params: { months } })
    return resp.data.trends
  },

  getWeeklySummary: async (weekStart: string, weekEnd: string): Promise<WeeklySummary> => {
    const resp: ApiResponse<WeeklySummary> = await apiClient.get('/v1/expenses/summary/weekly', { params: { weekStart, weekEnd } })
    return resp.data
  },

  getYearlySummary: async (year: number): Promise<YearlySummary> => {
    const resp: ApiResponse<YearlySummary> = await apiClient.get('/v1/expenses/summary/yearly', { params: { year } })
    return resp.data
  },

  getMerchantSummary: async (startDate?: string, endDate?: string): Promise<{ merchants: MerchantSummary[] }> => {
    const resp: ApiResponse<{ merchants: MerchantSummary[] }> = await apiClient.get('/v1/expenses/summary/by-merchant', { params: { startDate, endDate } })
    return resp.data
  },

  getAssetSummary: async (startDate?: string, endDate?: string): Promise<{ assets: AssetExpenseSummary[] }> => {
    const resp: ApiResponse<{ assets: AssetExpenseSummary[] }> = await apiClient.get('/v1/expenses/summary/by-asset', { params: { startDate, endDate } })
    return resp.data
  },

  getHeatmap: async (year: number, month: number): Promise<HeatmapCell[]> => {
    const resp: ApiResponse<{ cells: HeatmapCell[] }> = await apiClient.get('/v1/expenses/summary/heatmap', { params: { year, month } })
    return resp.data.cells
  },

  searchExpenses: async (params: ExpenseSearchParams): Promise<Expense[]> => {
    const resp: ApiResponse<{ expenses: Expense[] }> = await apiClient.get('/v1/expenses/search', { params })
    return resp.data.expenses
  },

  getExpensesByCalendarEvent: async (eventId: number): Promise<Expense[]> => {
    const resp: ApiResponse<{ expenses: Expense[] }> = await apiClient.get(`/v1/calendar/event/${eventId}/expenses`)
    return resp.data.expenses
  },

  getExpensesByTodo: async (todoId: number): Promise<Expense[]> => {
    const resp: ApiResponse<{ expenses: Expense[] }> = await apiClient.get(`/v1/todo/${todoId}/expenses`)
    return resp.data.expenses
  },
}
