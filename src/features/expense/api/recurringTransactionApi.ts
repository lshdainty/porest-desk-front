import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { RecurringTransaction } from '@/entities/expense'

export const recurringTransactionApi = {
  getRecurrings: async (): Promise<RecurringTransaction[]> => {
    const resp: ApiResponse<{ recurringTransactions: RecurringTransaction[] }> =
      await apiClient.get('/v1/recurring-transactions')
    return resp.data.recurringTransactions
  },
}
