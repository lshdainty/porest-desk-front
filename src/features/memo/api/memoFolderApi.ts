import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { MemoFolder, MemoFolderFormValues } from '@/entities/memo'

export const memoFolderApi = {
  createFolder: async (data: MemoFolderFormValues): Promise<MemoFolder> => {
    const resp: ApiResponse<MemoFolder> = await apiClient.post('/v1/memos/folders', data)
    return resp.data
  },

  getFolders: async (): Promise<MemoFolder[]> => {
    const resp: ApiResponse<MemoFolder[]> = await apiClient.get('/v1/memos/folders')
    return resp.data
  },

  updateFolder: async (id: number, data: MemoFolderFormValues): Promise<MemoFolder> => {
    const resp: ApiResponse<MemoFolder> = await apiClient.put(`/v1/memos/folders/${id}`, data)
    return resp.data
  },

  deleteFolder: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/memos/folders/${id}`)
    return resp.data
  },
}
