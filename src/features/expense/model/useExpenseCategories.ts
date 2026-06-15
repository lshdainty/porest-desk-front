import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { expenseKeys } from '@/shared/config'
import { expenseCategoryApi } from '../api/expenseCategoryApi'
import type { ExpenseCategory, ExpenseCategoryFormValues } from '@/entities/expense'

type ReorderItem = { categoryRowId: number; sortOrder: number; parentRowId: number | null }

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
    mutationFn: (items: ReorderItem[]) => expenseCategoryApi.reorderCategories(items),
    // 낙관적 업데이트: 드롭 즉시 캐시 순서를 갱신해 네트워크 왕복을 기다리지 않게 한다.
    onMutate: async (items: ReorderItem[]) => {
      await queryClient.cancelQueries({ queryKey: expenseKeys.categories() })
      const prev = queryClient.getQueryData<ExpenseCategory[]>(expenseKeys.categories())
      if (prev) {
        const patch = new Map(items.map(i => [i.categoryRowId, i]))
        queryClient.setQueryData<ExpenseCategory[]>(
          expenseKeys.categories(),
          prev.map(c => {
            const m = patch.get(c.rowId)
            return m ? { ...c, sortOrder: m.sortOrder, parentRowId: m.parentRowId } : c
          }),
        )
      }
      return { prev }
    },
    onError: (_err, _items, ctx) => {
      // 실패 시 이전 순서로 롤백 (에러 토스트는 apiClient 전역 핸들러가 노출).
      if (ctx?.prev) queryClient.setQueryData(expenseKeys.categories(), ctx.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.categories() })
    },
  })
}
