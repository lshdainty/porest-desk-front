import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { todoTagKeys, todoKeys } from '@/shared/config'
import { todoTagApi } from '../api/todoTagApi'
import type { TodoTagFormValues } from '@/entities/todo-tag'

export const useTodoTags = () => {
  return useQuery({
    queryKey: todoTagKeys.list(),
    queryFn: () => todoTagApi.getTags(),
  })
}

export const useCreateTodoTag = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: TodoTagFormValues) => todoTagApi.createTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoTagKeys.all })
    },
  })
}

export const useUpdateTodoTag = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TodoTagFormValues }) =>
      todoTagApi.updateTag(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoTagKeys.all })
      queryClient.invalidateQueries({ queryKey: todoKeys.all })
    },
  })
}

export const useDeleteTodoTag = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => todoTagApi.deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoTagKeys.all })
      queryClient.invalidateQueries({ queryKey: todoKeys.all })
    },
  })
}
