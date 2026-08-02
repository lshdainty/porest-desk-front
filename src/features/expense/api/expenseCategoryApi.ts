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

  /**
   * 카테고리에 달린 거래를 다른 카테고리로 일괄 이동.
   * 거래가 직접 달린 카테고리는 부모가 될 수 없어 하위를 만들 수 없는데, 그걸 푸는 유일한 방법.
   */
  moveTransactions: async (
    id: number,
    targetCategoryRowId: number,
  ): Promise<{ expenses: number; recurring: number; splits: number }> => {
    const resp: ApiResponse<{ expenses: number; recurring: number; splits: number }> =
      await apiClient.post(`/v1/expense/category/${id}/move-transactions`, { targetCategoryRowId })
    return resp.data
  },

  reorderCategories: async (
    items: { categoryRowId: number; sortOrder: number; parentRowId: number | null }[],
  ): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.patch('/v1/expense/categories/reorder', { items })
    return resp.data
  },
}
