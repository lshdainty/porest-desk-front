import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { todoKeys } from '@/shared/config'
import { todoApi } from '../api/todoApi'
import type { TodoListParams } from '../api/todoApi'
import type { Todo, TodoFormValues } from '@/entities/todo'

export const useTodos = (filters?: TodoListParams) => {
  return useQuery({
    queryKey: todoKeys.list(filters),
    queryFn: () => todoApi.getTodos(filters),
  })
}

export const useTodo = (id: number) => {
  return useQuery({
    queryKey: todoKeys.detail(id),
    queryFn: () => todoApi.getTodo(id),
    enabled: id > 0,
  })
}

export const useCreateTodo = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: TodoFormValues) => todoApi.createTodo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all })
    },
  })
}

export const useUpdateTodo = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TodoFormValues }) =>
      todoApi.updateTodo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all })
    },
  })
}

export const useToggleTodoStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => todoApi.toggleTodoStatus(id),
    onMutate: async (id: number) => {
      // 진행 중인 refetch 취소하여 optimistic update 덮어쓰기 방지
      await queryClient.cancelQueries({ queryKey: todoKeys.all })

      // 현재 캐시된 모든 todo list 쿼리 스냅샷 저장
      const previousQueries = queryClient.getQueriesData<Todo[]>({ queryKey: todoKeys.all })

      // 모든 todo list 캐시에서 해당 항목의 status를 즉시 토글
      queryClient.setQueriesData<Todo[]>({ queryKey: todoKeys.all }, (old) => {
        if (!old) return old
        return old.map((todo) =>
          todo.rowId === id
            ? {
                ...todo,
                status: todo.status === 'COMPLETED' ? 'PENDING' as const : 'COMPLETED' as const,
                completedAt: todo.status === 'COMPLETED' ? null : new Date().toISOString(),
              }
            : todo
        )
      })

      return { previousQueries }
    },
    onError: (_err, _id, context) => {
      // 에러 시 이전 상태로 롤백
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries) {
          queryClient.setQueryData(queryKey, data)
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all })
    },
  })
}

export const useReorderTodos = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (items: { todoId: number; sortOrder: number }[]) =>
      todoApi.reorderTodos(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all })
    },
  })
}

export const useDeleteTodo = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => todoApi.deleteTodo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all })
    },
  })
}

export const useSubtasks = (parentId: number) => {
  return useQuery({
    queryKey: todoKeys.subtasks(parentId),
    queryFn: () => todoApi.getSubtasks(parentId),
    enabled: parentId > 0,
  })
}

export const useUpdateTodoTags = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ todoId, tagIds }: { todoId: number; tagIds: number[] }) =>
      todoApi.updateTags(todoId, tagIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all })
    },
  })
}

export const useToggleTodoPin = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => todoApi.togglePin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all })
    },
  })
}

export const useTodoStats = () => {
  return useQuery({
    queryKey: todoKeys.stats(),
    queryFn: () => todoApi.getStats(),
  })
}
