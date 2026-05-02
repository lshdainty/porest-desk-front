import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { expenseKeys } from '@/shared/config'
import { expenseCategoryApi } from '../api/expenseCategoryApi'
import type { ExpenseCategoryFormValues } from '@/entities/expense'

export const useExpenseCategories = () => {
  return useQuery({
    queryKey: expenseKeys.categories(),
    queryFn: () => expenseCategoryApi.getCategories(),
  })
}

export const useCreateExpenseCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ExpenseCategoryFormValues) => expenseCategoryApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
    },
  })
}

export const useUpdateExpenseCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ExpenseCategoryFormValues }) =>
      expenseCategoryApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
    },
  })
}

export const useDeleteExpenseCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => expenseCategoryApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
    },
  })
}

export const useReorderExpenseCategories = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (items: { categoryRowId: number; sortOrder: number; parentRowId: number | null }[]) =>
      expenseCategoryApi.reorderCategories(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.categories() })
    },
  })
}
