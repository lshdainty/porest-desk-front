import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { memoKeys } from '@/shared/config'
import { memoFolderApi } from '../api/memoFolderApi'
import type { MemoFolderFormValues } from '@/entities/memo'

export const useMemoFolders = () => {
  return useQuery({
    queryKey: memoKeys.folders(),
    queryFn: () => memoFolderApi.getFolders(),
  })
}

export const useCreateMemoFolder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: MemoFolderFormValues) => memoFolderApi.createFolder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memoKeys.all })
    },
  })
}

export const useUpdateMemoFolder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: MemoFolderFormValues }) =>
      memoFolderApi.updateFolder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memoKeys.all })
    },
  })
}

export const useDeleteMemoFolder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => memoFolderApi.deleteFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memoKeys.all })
    },
  })
}
