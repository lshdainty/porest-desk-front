import { useQuery } from '@tanstack/react-query'
import { expenseKeys } from '@/shared/config'
import { recurringTransactionApi } from '../api/recurringTransactionApi'

export const useRecurringTransactions = () => {
  return useQuery({
    queryKey: expenseKeys.recurring(),
    queryFn: () => recurringTransactionApi.getRecurrings(),
  })
}
