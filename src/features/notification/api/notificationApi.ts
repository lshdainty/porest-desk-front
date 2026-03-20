import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { Notification } from '@/entities/notification'

export const notificationApi = {
  getNotifications: async (): Promise<Notification[]> => {
    const resp: ApiResponse<{ notifications: Notification[] }> = await apiClient.get('/v1/notifications')
    return resp.data.notifications
  },

  getUnreadCount: async (): Promise<number> => {
    const resp: ApiResponse<{ count: number }> = await apiClient.get('/v1/notifications/unread-count')
    return resp.data.count
  },

  markRead: async (id: number): Promise<void> => {
    await apiClient.patch(`/v1/notification/${id}/read`)
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.patch('/v1/notifications/read-all')
  },

  deleteNotification: async (id: number): Promise<void> => {
    await apiClient.delete(`/v1/notification/${id}`)
  },
}
