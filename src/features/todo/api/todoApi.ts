import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { Todo, TodoFormValues } from '@/entities/todo'

export interface TodoListParams {
  status?: string
  priority?: string
  category?: string
  startDate?: string
  endDate?: string
}

export const todoApi = {
  createTodo: async (data: TodoFormValues): Promise<Todo> => {
    const resp: ApiResponse<Todo> = await apiClient.post('/v1/todos', data)
    return resp.data
  },

  getTodos: async (params?: TodoListParams): Promise<Todo[]> => {
    const resp: ApiResponse<Todo[]> = await apiClient.get('/v1/todos', { params })
    return resp.data
  },

  getTodo: async (id: number): Promise<Todo> => {
    const resp: ApiResponse<Todo> = await apiClient.get(`/v1/todos/${id}`)
    return resp.data
  },

  updateTodo: async (id: number, data: TodoFormValues): Promise<Todo> => {
    const resp: ApiResponse<Todo> = await apiClient.put(`/v1/todos/${id}`, data)
    return resp.data
  },

  toggleTodoStatus: async (id: number): Promise<Todo> => {
    const resp: ApiResponse<Todo> = await apiClient.patch(`/v1/todos/${id}/toggle`)
    return resp.data
  },

  reorderTodos: async (items: { rowId: number, sortOrder: number }[]): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.patch('/v1/todos/reorder', { items })
    return resp.data
  },

  deleteTodo: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/todos/${id}`)
    return resp.data
  },
}
