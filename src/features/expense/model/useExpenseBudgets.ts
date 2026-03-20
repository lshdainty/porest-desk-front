import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { expenseKeys } from '@/shared/config'
import { expenseBudgetApi } from '../api/expenseBudgetApi'
import type { BudgetListParams } from '../api/expenseBudgetApi'
import type { ExpenseBudgetFormValues } from '@/entities/expense'

export const useExpenseBudgets = (params: BudgetListParams) => {
  return useQuery({
    queryKey: expenseKeys.budgets(params),
    queryFn: () => expenseBudgetApi.getBudgets(params),
    enabled: params.year > 0 && params.month > 0,
  })
}

export const useCreateExpenseBudget = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ExpenseBudgetFormValues) => expenseBudgetApi.createBudget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
    },
  })
}

export const useDeleteExpenseBudget = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => expenseBudgetApi.deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
    },
  })
}
