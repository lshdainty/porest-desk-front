import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventCommentKeys } from '@/shared/config'
import { eventCommentApi } from '../api/eventCommentApi'
import type { EventCommentFormValues } from '@/entities/group'

export const useEventComments = (eventId: number) => {
  return useQuery({
    queryKey: eventCommentKeys.list(eventId),
    queryFn: () => eventCommentApi.getComments(eventId),
    enabled: eventId > 0,
  })
}

export const useCreateEventComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: number; data: EventCommentFormValues }) =>
      eventCommentApi.createComment(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventCommentKeys.all })
    },
  })
}

export const useUpdateEventComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string }) =>
      eventCommentApi.updateComment(commentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventCommentKeys.all })
    },
  })
}

export const useDeleteEventComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (commentId: number) => eventCommentApi.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventCommentKeys.all })
    },
  })
}
