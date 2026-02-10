import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { todoKeys } from '@/shared/config'
import { todoApi } from '../api/todoApi'
import type { TodoListParams } from '../api/todoApi'
import type { TodoFormValues } from '@/entities/todo'

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
    onSuccess: () => {
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

export const useTodoStats = () => {
  return useQuery({
    queryKey: todoKeys.stats(),
    queryFn: () => todoApi.getStats(),
  })
}
