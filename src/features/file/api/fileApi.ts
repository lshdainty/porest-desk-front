import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { FileAttachment, ReferenceType } from '@/entities/file'

export const fileApi = {
  uploadFile: async (file: File, referenceType: ReferenceType, referenceRowId?: number): Promise<FileAttachment> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('referenceType', referenceType)
    if (referenceRowId) {
      formData.append('referenceRowId', referenceRowId.toString())
    }
    const resp: ApiResponse<FileAttachment> = await apiClient.post('/v1/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return resp.data
  },

  getFileUrl: (fileId: number): string => {
    return `/api/v1/files/${fileId}`
  },

  getFilesByReference: async (referenceType: ReferenceType, referenceRowId: number): Promise<FileAttachment[]> => {
    const resp: ApiResponse<{ files: FileAttachment[] }> = await apiClient.get('/v1/files', {
      params: { referenceType, referenceRowId },
    })
    return resp.data.files
  },

  deleteFile: async (fileId: number): Promise<void> => {
    await apiClient.delete(`/v1/files/${fileId}`)
  },
}
