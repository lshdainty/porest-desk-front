import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { MemoFolder, MemoFolderFormValues } from '@/entities/memo'

export const memoFolderApi = {
  createFolder: async (data: MemoFolderFormValues): Promise<MemoFolder> => {
    const resp: ApiResponse<MemoFolder> = await apiClient.post('/v1/memo/folder', data)
    return resp.data
  },

  getFolders: async (): Promise<MemoFolder[]> => {
    const resp: ApiResponse<{ folders: MemoFolder[] }> = await apiClient.get('/v1/memo/folders')
    return resp.data.folders
  },

  updateFolder: async (id: number, data: MemoFolderFormValues): Promise<MemoFolder> => {
    const resp: ApiResponse<MemoFolder> = await apiClient.put(`/v1/memo/folder/${id}`, data)
    return resp.data
  },

  deleteFolder: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/memo/folder/${id}`)
    return resp.data
  },

  reorderFolders: async (items: { folderId: number; sortOrder: number }[]): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.patch('/v1/memo/folders/reorder', { items })
    return resp.data
  },
}
