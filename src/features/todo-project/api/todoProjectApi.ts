import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { TodoProject, TodoProjectFormValues } from '@/entities/todo-project'

export const todoProjectApi = {
  createProject: async (data: TodoProjectFormValues): Promise<TodoProject> => {
    const resp: ApiResponse<TodoProject> = await apiClient.post('/v1/todo-project', data)
    return resp.data
  },

  getProjects: async (): Promise<TodoProject[]> => {
    const resp: ApiResponse<{ projects: TodoProject[] }> = await apiClient.get('/v1/todo-projects')
    return resp.data.projects
  },

  updateProject: async (id: number, data: TodoProjectFormValues): Promise<TodoProject> => {
    const resp: ApiResponse<TodoProject> = await apiClient.put(`/v1/todo-project/${id}`, data)
    return resp.data
  },

  reorderProjects: async (items: { projectId: number; sortOrder: number }[]): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.patch('/v1/todo-projects/reorder', { items })
    return resp.data
  },

  deleteProject: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/todo-project/${id}`)
    return resp.data
  },
}
