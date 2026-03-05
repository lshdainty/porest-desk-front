import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { Memo, MemoFormValues } from '@/entities/memo'

export interface MemoListParams {
  folderId?: number
  search?: string
}

export const memoApi = {
  createMemo: async (data: MemoFormValues): Promise<Memo> => {
    const resp: ApiResponse<Memo> = await apiClient.post('/v1/memo', data)
    return resp.data
  },

  getMemos: async (params?: MemoListParams): Promise<Memo[]> => {
    const resp: ApiResponse<{ memos: Memo[] }> = await apiClient.get('/v1/memos', { params })
    return resp.data.memos
  },

  getMemo: async (id: number): Promise<Memo> => {
    const resp: ApiResponse<Memo> = await apiClient.get(`/v1/memo/${id}`)
    return resp.data
  },

  updateMemo: async (id: number, data: MemoFormValues): Promise<Memo> => {
    const resp: ApiResponse<Memo> = await apiClient.put(`/v1/memo/${id}`, data)
    return resp.data
  },

  togglePin: async (id: number): Promise<Memo> => {
    const resp: ApiResponse<Memo> = await apiClient.patch(`/v1/memo/${id}/pin`)
    return resp.data
  },

  deleteMemo: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/memo/${id}`)
    return resp.data
  },
}
