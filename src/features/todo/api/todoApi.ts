import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { Todo, TodoFormValues, TodoStats } from '@/entities/todo'

export interface TodoListParams {
  status?: string
  priority?: string
  category?: string
  startDate?: string
  endDate?: string
  projectRowId?: number
}

export const todoApi = {
  createTodo: async (data: TodoFormValues): Promise<Todo> => {
    const resp: ApiResponse<Todo> = await apiClient.post('/v1/todo', data)
    return resp.data
  },

  getTodos: async (params?: TodoListParams): Promise<Todo[]> => {
    const resp: ApiResponse<{ todos: Todo[] }> = await apiClient.get('/v1/todos', { params })
    return resp.data.todos
  },

  getTodo: async (id: number): Promise<Todo> => {
    const resp: ApiResponse<Todo> = await apiClient.get(`/v1/todo/${id}`)
    return resp.data
  },

  updateTodo: async (id: number, data: TodoFormValues): Promise<Todo> => {
    const resp: ApiResponse<Todo> = await apiClient.put(`/v1/todo/${id}`, data)
    return resp.data
  },

  toggleTodoStatus: async (id: number): Promise<Todo> => {
    const resp: ApiResponse<Todo> = await apiClient.patch(`/v1/todo/${id}/status`)
    return resp.data
  },

  reorderTodos: async (items: { todoId: number; sortOrder: number }[]): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.patch('/v1/todos/reorder', { items })
    return resp.data
  },

  deleteTodo: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/todo/${id}`)
    return resp.data
  },

  getSubtasks: async (parentId: number): Promise<Todo[]> => {
    const resp: ApiResponse<{ todos: Todo[] }> = await apiClient.get(`/v1/todo/${parentId}/subtasks`)
    return resp.data.todos
  },

  updateTags: async (todoId: number, tagIds: number[]): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.patch(`/v1/todo/${todoId}/tags`, { tagIds })
    return resp.data
  },

  getStats: async (): Promise<TodoStats> => {
    const resp: ApiResponse<TodoStats> = await apiClient.get('/v1/todos/stats')
    return resp.data
  },
}
