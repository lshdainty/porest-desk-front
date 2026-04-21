import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { RecurringTransaction, RecurringTransactionFormValues } from '@/entities/recurring-transaction'

export const recurringTransactionApi = {
  createRecurring: async (data: RecurringTransactionFormValues): Promise<RecurringTransaction> => {
    const resp: ApiResponse<RecurringTransaction> = await apiClient.post('/v1/recurring-transaction', data)
    return resp.data
  },

  getRecurrings: async (params?: { upcoming?: boolean; limit?: number }): Promise<{ recurringTransactions: RecurringTransaction[] }> => {
    const q: Record<string, string> = {}
    if (params?.upcoming) q.upcoming = 'true'
    if (params?.limit) q.limit = String(params.limit)
    const resp: ApiResponse<{ recurringTransactions: RecurringTransaction[] }> =
      await apiClient.get('/v1/recurring-transactions', { params: q })
    return resp.data
  },

  updateRecurring: async (id: number, data: RecurringTransactionFormValues): Promise<RecurringTransaction> => {
    const resp: ApiResponse<RecurringTransaction> = await apiClient.put(`/v1/recurring-transaction/${id}`, data)
    return resp.data
  },

  deleteRecurring: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/recurring-transaction/${id}`)
    return resp.data
  },

  toggleActive: async (id: number): Promise<RecurringTransaction> => {
    const resp: ApiResponse<RecurringTransaction> = await apiClient.patch(`/v1/recurring-transaction/${id}/toggle`)
    return resp.data
  },
}
