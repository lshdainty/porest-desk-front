import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { ExpenseBudget, ExpenseBudgetFormValues, BudgetComplianceMonth } from '@/entities/expense'

export interface BudgetListParams {
  year: number
  month: number
}

export const expenseBudgetApi = {
  createBudget: async (data: ExpenseBudgetFormValues): Promise<ExpenseBudget> => {
    const resp: ApiResponse<ExpenseBudget> = await apiClient.post('/v1/expense/budget', data)
    return resp.data
  },

  getBudgets: async (params: BudgetListParams): Promise<ExpenseBudget[]> => {
    const resp: ApiResponse<{ budgets: ExpenseBudget[] }> = await apiClient.get('/v1/expense/budgets', { params })
    return resp.data.budgets
  },

  deleteBudget: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/expense/budget/${id}`)
    return resp.data
  },

  getCompliance: async (months = 6): Promise<BudgetComplianceMonth[]> => {
    const resp: ApiResponse<{ months: BudgetComplianceMonth[] }> =
      await apiClient.get('/v1/expense/budgets/compliance', { params: { months } })
    return resp.data.months
  },
}
