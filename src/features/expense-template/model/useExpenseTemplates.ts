import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { expenseTemplateKeys, expenseKeys } from '@/shared/config'
import { expenseTemplateApi } from '../api/expenseTemplateApi'
import type { ExpenseTemplateFormValues, ExpenseTemplateUseValues } from '@/entities/expense-template'

export const useExpenseTemplates = () => {
  return useQuery({
    queryKey: expenseTemplateKeys.list(),
    queryFn: () => expenseTemplateApi.getTemplates(),
  })
}

export const useCreateExpenseTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ExpenseTemplateFormValues) => expenseTemplateApi.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseTemplateKeys.all })
    },
  })
}

export const useUpdateExpenseTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ExpenseTemplateFormValues }) =>
      expenseTemplateApi.updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseTemplateKeys.all })
    },
  })
}

export const useDeleteExpenseTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => expenseTemplateApi.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseTemplateKeys.all })
    },
  })
}

export const useUseExpenseTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ExpenseTemplateUseValues }) =>
      expenseTemplateApi.useTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
      queryClient.invalidateQueries({ queryKey: expenseTemplateKeys.all })
    },
  })
}
