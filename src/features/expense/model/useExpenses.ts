import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { expenseKeys } from '@/shared/config'
import { expenseApi } from '../api/expenseApi'
import type { ExpenseListParams, ExpenseSearchParams } from '../api/expenseApi'
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

export const useMonthlyTrend = (months = 6) => {
  return useQuery({
    queryKey: expenseKeys.monthlyTrend(months),
    queryFn: () => expenseApi.getMonthlyTrend(months),
    enabled: months > 0,
  })
}

export const useWeeklySummary = (weekStart: string, weekEnd: string) => {
  return useQuery({
    queryKey: expenseKeys.weeklySummary(weekStart, weekEnd),
    queryFn: () => expenseApi.getWeeklySummary(weekStart, weekEnd),
    enabled: !!weekStart && !!weekEnd,
  })
}

export const useYearlySummary = (year: number) => {
  return useQuery({
    queryKey: expenseKeys.yearlySummary(year),
    queryFn: () => expenseApi.getYearlySummary(year),
    enabled: year > 0,
  })
}

export const useMerchantSummary = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: expenseKeys.merchantSummary({ startDate, endDate }),
    queryFn: () => expenseApi.getMerchantSummary(startDate, endDate),
  })
}

export const useExpenseHeatmap = (year: number, month: number) => {
  return useQuery({
    queryKey: expenseKeys.heatmap(year, month),
    queryFn: () => expenseApi.getHeatmap(year, month),
    enabled: year > 0 && month > 0,
  })
}

export const useAssetExpenseSummary = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: expenseKeys.assetSummary({ startDate, endDate }),
    queryFn: () => expenseApi.getAssetSummary(startDate, endDate),
  })
}

export const useSearchExpenses = (params: ExpenseSearchParams) => {
  return useQuery({
    queryKey: expenseKeys.search(params),
    queryFn: () => expenseApi.searchExpenses(params),
    enabled: Object.values(params).some(v => v !== undefined && v !== ''),
  })
}

export const useExpensesByCalendarEvent = (eventId: number) => {
  return useQuery({
    queryKey: expenseKeys.byCalendarEvent(eventId),
    queryFn: () => expenseApi.getExpensesByCalendarEvent(eventId),
    enabled: eventId > 0,
  })
}

export const useExpensesByTodo = (todoId: number) => {
  return useQuery({
    queryKey: expenseKeys.byTodo(todoId),
    queryFn: () => expenseApi.getExpensesByTodo(todoId),
    enabled: todoId > 0,
  })
}
