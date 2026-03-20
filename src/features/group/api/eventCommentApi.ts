import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { EventComment, EventCommentFormValues } from '@/entities/group'

export const eventCommentApi = {
  createComment: async (eventId: number, data: EventCommentFormValues): Promise<EventComment> => {
    const resp: ApiResponse<EventComment> = await apiClient.post(
      `/v1/calendar/event/${eventId}/comment`,
      data
    )
    return resp.data
  },

  getComments: async (eventId: number): Promise<EventComment[]> => {
    const resp: ApiResponse<{ comments: EventComment[] }> = await apiClient.get(
      `/v1/calendar/event/${eventId}/comments`
    )
    return resp.data.comments
  },

  updateComment: async (commentId: number, content: string): Promise<EventComment> => {
    const resp: ApiResponse<EventComment> = await apiClient.put(
      `/v1/calendar/comment/${commentId}`,
      { content }
    )
    return resp.data
  },

  deleteComment: async (commentId: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/calendar/comment/${commentId}`)
    return resp.data
  },
}
