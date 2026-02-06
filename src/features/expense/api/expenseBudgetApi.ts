import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { ExpenseBudget, ExpenseBudgetFormValues } from '@/entities/expense'

export interface BudgetListParams {
  year: number
  month: number
}

export const expenseBudgetApi = {
  createBudget: async (data: ExpenseBudgetFormValues): Promise<ExpenseBudget> => {
    const resp: ApiResponse<ExpenseBudget> = await apiClient.post('/v1/expenses/budgets', data)
    return resp.data
  },

  getBudgets: async (params: BudgetListParams): Promise<ExpenseBudget[]> => {
    const resp: ApiResponse<ExpenseBudget[]> = await apiClient.get('/v1/expenses/budgets', { params })
    return resp.data
  },

  deleteBudget: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/expenses/budgets/${id}`)
    return resp.data
  },
}
