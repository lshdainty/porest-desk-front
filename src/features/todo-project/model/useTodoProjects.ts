import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { todoProjectKeys, todoKeys } from '@/shared/config'
import { todoProjectApi } from '../api/todoProjectApi'
import type { TodoProjectFormValues } from '@/entities/todo-project'

export const useTodoProjects = () => {
  return useQuery({
    queryKey: todoProjectKeys.list(),
    queryFn: () => todoProjectApi.getProjects(),
  })
}

export const useCreateTodoProject = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: TodoProjectFormValues) => todoProjectApi.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoProjectKeys.all })
    },
  })
}

export const useUpdateTodoProject = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TodoProjectFormValues }) =>
      todoProjectApi.updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoProjectKeys.all })
    },
  })
}

export const useReorderTodoProjects = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (items: { projectId: number; sortOrder: number }[]) =>
      todoProjectApi.reorderProjects(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoProjectKeys.all })
    },
  })
}

export const useDeleteTodoProject = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => todoProjectApi.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoProjectKeys.all })
      queryClient.invalidateQueries({ queryKey: todoKeys.all })
    },
  })
}
