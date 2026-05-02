import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { recurringTransactionKeys } from '@/shared/config'
import { recurringTransactionApi } from '../api/recurringTransactionApi'
import type { RecurringTransactionFormValues } from '@/entities/recurring-transaction'

export const useRecurringTransactions = (params?: { upcoming?: boolean; limit?: number }) => {
  return useQuery({
    queryKey: recurringTransactionKeys.list(params),
    queryFn: async () => {
      const response = await recurringTransactionApi.getRecurrings(params)
      return response.recurringTransactions
    },
  })
}

export const useCreateRecurringTransaction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: RecurringTransactionFormValues) => recurringTransactionApi.createRecurring(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringTransactionKeys.all })
    },
  })
}

export const useUpdateRecurringTransaction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RecurringTransactionFormValues }) =>
      recurringTransactionApi.updateRecurring(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringTransactionKeys.all })
    },
  })
}

export const useDeleteRecurringTransaction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => recurringTransactionApi.deleteRecurring(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringTransactionKeys.all })
    },
  })
}

export const useToggleRecurringTransaction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => recurringTransactionApi.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringTransactionKeys.all })
    },
  })
}
