import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { RecurringTransaction, RecurringTransactionFormValues } from '@/entities/recurring-transaction'

export const recurringTransactionApi = {
  createRecurring: async (data: RecurringTransactionFormValues): Promise<RecurringTransaction> => {
    const resp: ApiResponse<RecurringTransaction> = await apiClient.post('/v1/recurring-transaction', data)
    return resp.data
  },

  getRecurrings: async (): Promise<{ recurringTransactions: RecurringTransaction[] }> => {
    const resp: ApiResponse<{ recurringTransactions: RecurringTransaction[] }> = await apiClient.get('/v1/recurring-transactions')
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
