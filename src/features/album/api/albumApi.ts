import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { Album, AlbumDetail, AlbumPhoto, AlbumFormValues, AddPhotoValues } from '@/entities/album'

export const albumApi = {
  createAlbum: async (data: AlbumFormValues): Promise<Album> => {
    const resp: ApiResponse<Album> = await apiClient.post('/v1/album', data)
    return resp.data
  },

  getAlbums: async (groupRowId: number): Promise<Album[]> => {
    const resp: ApiResponse<{ albums: Album[] }> = await apiClient.get('/v1/albums', {
      params: { groupRowId },
    })
    return resp.data.albums
  },

  getAlbum: async (albumId: number): Promise<AlbumDetail> => {
    const resp: ApiResponse<AlbumDetail> = await apiClient.get(`/v1/album/${albumId}`)
    return resp.data
  },

  updateAlbum: async (albumId: number, data: { albumName: string; description?: string }): Promise<Album> => {
    const resp: ApiResponse<Album> = await apiClient.put(`/v1/album/${albumId}`, data)
    return resp.data
  },

  deleteAlbum: async (albumId: number): Promise<void> => {
    await apiClient.delete(`/v1/album/${albumId}`)
  },

  addPhoto: async (albumId: number, data: AddPhotoValues): Promise<AlbumPhoto> => {
    const resp: ApiResponse<AlbumPhoto> = await apiClient.post(`/v1/album/${albumId}/photo`, data)
    return resp.data
  },

  removePhoto: async (photoId: number): Promise<void> => {
    await apiClient.delete(`/v1/album/photo/${photoId}`)
  },

  setCover: async (albumId: number, fileRowId: number): Promise<Album> => {
    const resp: ApiResponse<Album> = await apiClient.patch(`/v1/album/${albumId}/cover`, { fileRowId })
    return resp.data
  },
}
