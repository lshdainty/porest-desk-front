import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { expenseSplitKeys, expenseKeys } from '@/shared/config'
import { expenseSplitApi } from '../api/expenseSplitApi'
import type { ExpenseSplitFormValue } from '@/entities/expense-split'

export const useExpenseSplits = (expenseId: number | null | undefined) => {
  return useQuery({
    queryKey: expenseSplitKeys.list(expenseId ?? 0),
    queryFn: async () => {
      if (!expenseId) return []
      const response = await expenseSplitApi.getSplits(expenseId)
      return response.splits
    },
    enabled: !!expenseId,
  })
}

export const useReplaceExpenseSplits = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ expenseId, splits }: { expenseId: number; splits: ExpenseSplitFormValue[] }) =>
      expenseSplitApi.replaceSplits(expenseId, splits),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: expenseSplitKeys.list(variables.expenseId) })
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
    },
  })
}

export const useDeleteAllExpenseSplits = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (expenseId: number) => expenseSplitApi.deleteAllSplits(expenseId),
    onSuccess: (_data, expenseId) => {
      queryClient.invalidateQueries({ queryKey: expenseSplitKeys.list(expenseId) })
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
    },
  })
}
