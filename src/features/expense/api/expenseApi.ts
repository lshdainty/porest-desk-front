import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { Expense, ExpenseFormValues, DailySummary, MonthlySummary } from '@/entities/expense'

export interface ExpenseListParams {
  expenseType?: string
  categoryRowId?: number
  startDate?: string
  endDate?: string
}

export const expenseApi = {
  createExpense: async (data: ExpenseFormValues): Promise<Expense> => {
    const resp: ApiResponse<Expense> = await apiClient.post('/v1/expenses', data)
    return resp.data
  },

  getExpenses: async (params?: ExpenseListParams): Promise<Expense[]> => {
    const resp: ApiResponse<Expense[]> = await apiClient.get('/v1/expenses', { params })
    return resp.data
  },

  updateExpense: async (id: number, data: ExpenseFormValues): Promise<Expense> => {
    const resp: ApiResponse<Expense> = await apiClient.put(`/v1/expenses/${id}`, data)
    return resp.data
  },

  deleteExpense: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/expenses/${id}`)
    return resp.data
  },

  getDailySummary: async (date: string): Promise<DailySummary> => {
    const resp: ApiResponse<DailySummary> = await apiClient.get(`/v1/expenses/daily-summary`, { params: { date } })
    return resp.data
  },

  getMonthlySummary: async (year: number, month: number): Promise<MonthlySummary> => {
    const resp: ApiResponse<MonthlySummary> = await apiClient.get(`/v1/expenses/monthly-summary`, { params: { year, month } })
    return resp.data
  },
}
