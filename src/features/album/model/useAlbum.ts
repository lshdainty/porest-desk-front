import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { albumKeys } from '@/shared/config'
import { albumApi } from '../api/albumApi'
import type { AlbumFormValues, AddPhotoValues } from '@/entities/album'

export const useAlbums = (groupRowId: number) => {
  return useQuery({
    queryKey: albumKeys.list(groupRowId),
    queryFn: () => albumApi.getAlbums(groupRowId),
    enabled: groupRowId > 0,
  })
}

export const useAlbum = (albumId: number) => {
  return useQuery({
    queryKey: albumKeys.detail(albumId),
    queryFn: () => albumApi.getAlbum(albumId),
    enabled: albumId > 0,
  })
}

export const useCreateAlbum = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AlbumFormValues) => albumApi.createAlbum(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: albumKeys.all })
    },
  })
}

export const useUpdateAlbum = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { albumName: string; description?: string } }) =>
      albumApi.updateAlbum(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: albumKeys.all })
    },
  })
}

export const useDeleteAlbum = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (albumId: number) => albumApi.deleteAlbum(albumId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: albumKeys.all })
    },
  })
}

export const useAddPhoto = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ albumId, data }: { albumId: number; data: AddPhotoValues }) =>
      albumApi.addPhoto(albumId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: albumKeys.all })
    },
  })
}

export const useRemovePhoto = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (photoId: number) => albumApi.removePhoto(photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: albumKeys.all })
    },
  })
}

export const useSetCover = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ albumId, fileRowId }: { albumId: number; fileRowId: number }) =>
      albumApi.setCover(albumId, fileRowId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: albumKeys.all })
    },
  })
}
