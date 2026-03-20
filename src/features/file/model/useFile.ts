import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fileKeys } from '@/shared/config'
import { fileApi } from '../api/fileApi'
import type { ReferenceType } from '@/entities/file'

export const useFilesByReference = (referenceType: ReferenceType, referenceRowId: number) => {
  return useQuery({
    queryKey: fileKeys.byReference(referenceType, referenceRowId),
    queryFn: () => fileApi.getFilesByReference(referenceType, referenceRowId),
    enabled: referenceRowId > 0,
  })
}

export const useUploadFile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ file, referenceType, referenceRowId }: {
      file: File
      referenceType: ReferenceType
      referenceRowId?: number
    }) => fileApi.uploadFile(file, referenceType, referenceRowId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileKeys.all })
    },
  })
}

export const useDeleteFile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (fileId: number) => fileApi.deleteFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileKeys.all })
    },
  })
}
