import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { ExpenseCategory, ExpenseCategoryFormValues } from '@/entities/expense'

export const expenseCategoryApi = {
  createCategory: async (data: ExpenseCategoryFormValues): Promise<ExpenseCategory> => {
    const resp: ApiResponse<ExpenseCategory> = await apiClient.post('/v1/expenses/categories', data)
    return resp.data
  },

  getCategories: async (): Promise<ExpenseCategory[]> => {
    const resp: ApiResponse<ExpenseCategory[]> = await apiClient.get('/v1/expenses/categories')
    return resp.data
  },

  updateCategory: async (id: number, data: ExpenseCategoryFormValues): Promise<ExpenseCategory> => {
    const resp: ApiResponse<ExpenseCategory> = await apiClient.put(`/v1/expenses/categories/${id}`, data)
    return resp.data
  },

  deleteCategory: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/expenses/categories/${id}`)
    return resp.data
  },
}
