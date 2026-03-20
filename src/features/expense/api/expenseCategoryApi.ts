import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { ExpenseCategory, ExpenseCategoryFormValues } from '@/entities/expense'

export const expenseCategoryApi = {
  createCategory: async (data: ExpenseCategoryFormValues): Promise<ExpenseCategory> => {
    const resp: ApiResponse<ExpenseCategory> = await apiClient.post('/v1/expense/category', data)
    return resp.data
  },

  getCategories: async (): Promise<ExpenseCategory[]> => {
    const resp: ApiResponse<{ categories: ExpenseCategory[] }> = await apiClient.get('/v1/expense/categories')
    return resp.data.categories
  },

  updateCategory: async (id: number, data: ExpenseCategoryFormValues): Promise<ExpenseCategory> => {
    const resp: ApiResponse<ExpenseCategory> = await apiClient.put(`/v1/expense/category/${id}`, data)
    return resp.data
  },

  deleteCategory: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/expense/category/${id}`)
    return resp.data
  },
}
