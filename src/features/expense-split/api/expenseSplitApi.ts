import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { ExpenseSplit, ExpenseSplitFormValue } from '@/entities/expense-split'

export const expenseSplitApi = {
  getSplits: async (expenseId: number): Promise<{ splits: ExpenseSplit[] }> => {
    const resp: ApiResponse<{ splits: ExpenseSplit[] }> =
      await apiClient.get(`/v1/expense/${expenseId}/splits`)
    return resp.data
  },

  replaceSplits: async (expenseId: number, splits: ExpenseSplitFormValue[]): Promise<{ splits: ExpenseSplit[] }> => {
    const resp: ApiResponse<{ splits: ExpenseSplit[] }> =
      await apiClient.put(`/v1/expense/${expenseId}/splits`, { splits })
    return resp.data
  },

  deleteAllSplits: async (expenseId: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/expense/${expenseId}/splits`)
    return resp.data
  },
}
