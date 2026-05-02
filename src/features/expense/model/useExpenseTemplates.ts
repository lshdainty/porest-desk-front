import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { expenseKeys } from '@/shared/config'
import { expenseTemplateApi } from '../api/expenseTemplateApi'
import type { ExpenseTemplateFormValues } from '@/entities/expense-template'

export const useExpenseTemplates = () => {
  return useQuery({
    queryKey: expenseKeys.templates(),
    queryFn: () => expenseTemplateApi.getTemplates(),
  })
}

export const useCreateExpenseTemplate = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ExpenseTemplateFormValues) => expenseTemplateApi.createTemplate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseKeys.templates() })
    },
  })
}

export const useUpdateExpenseTemplate = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ExpenseTemplateFormValues }) =>
      expenseTemplateApi.updateTemplate(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseKeys.templates() })
    },
  })
}

export const useDeleteExpenseTemplate = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => expenseTemplateApi.deleteTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseKeys.templates() })
    },
  })
}

export const useUseExpenseTemplate = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, expenseDate }: { id: number; expenseDate: string }) =>
      expenseTemplateApi.useTemplate(id, expenseDate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseKeys.all })
    },
  })
}

export const useTouchExpenseTemplate = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => expenseTemplateApi.touchTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseKeys.templates() })
    },
  })
}
