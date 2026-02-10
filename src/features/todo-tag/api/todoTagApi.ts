import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { TodoTag, TodoTagFormValues } from '@/entities/todo-tag'

export const todoTagApi = {
  createTag: async (data: TodoTagFormValues): Promise<TodoTag> => {
    const resp: ApiResponse<TodoTag> = await apiClient.post('/v1/todo-tag', data)
    return resp.data
  },

  getTags: async (): Promise<TodoTag[]> => {
    const resp: ApiResponse<{ tags: TodoTag[] }> = await apiClient.get('/v1/todo-tags')
    return resp.data.tags
  },

  updateTag: async (id: number, data: TodoTagFormValues): Promise<TodoTag> => {
    const resp: ApiResponse<TodoTag> = await apiClient.put(`/v1/todo-tag/${id}`, data)
    return resp.data
  },

  deleteTag: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/todo-tag/${id}`)
    return resp.data
  },
}
