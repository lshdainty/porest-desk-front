import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { expenseKeys } from '@/shared/config'
import { expenseApi } from '../api/expenseApi'
import type { ExpenseListParams } from '../api/expenseApi'
import type { ExpenseFormValues } from '@/entities/expense'

export const useExpenses = (filters?: ExpenseListParams) => {
  return useQuery({
    queryKey: expenseKeys.list(filters),
    queryFn: () => expenseApi.getExpenses(filters),
  })
}

export const useCreateExpense = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ExpenseFormValues) => expenseApi.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
    },
  })
}

export const useUpdateExpense = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ExpenseFormValues }) =>
      expenseApi.updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
    },
  })
}

export const useDeleteExpense = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => expenseApi.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
    },
  })
}

export const useDailySummary = (date: string) => {
  return useQuery({
    queryKey: expenseKeys.dailySummary(date),
    queryFn: () => expenseApi.getDailySummary(date),
    enabled: !!date,
  })
}

export const useMonthlySummary = (year: number, month: number) => {
  return useQuery({
    queryKey: expenseKeys.monthlySummary(year, month),
    queryFn: () => expenseApi.getMonthlySummary(year, month),
    enabled: year > 0 && month > 0,
  })
}
