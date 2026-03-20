import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventLabelKeys, calendarKeys } from '@/shared/config'
import { eventLabelApi } from '../api/eventLabelApi'
import type { EventLabelFormValues } from '@/entities/event-label'

export const useEventLabels = () => {
  return useQuery({
    queryKey: eventLabelKeys.list(),
    queryFn: () => eventLabelApi.getLabels(),
  })
}

export const useCreateEventLabel = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: EventLabelFormValues) => eventLabelApi.createLabel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventLabelKeys.all })
    },
  })
}

export const useUpdateEventLabel = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: EventLabelFormValues }) =>
      eventLabelApi.updateLabel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventLabelKeys.all })
      queryClient.invalidateQueries({ queryKey: calendarKeys.all })
    },
  })
}

export const useDeleteEventLabel = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => eventLabelApi.deleteLabel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventLabelKeys.all })
      queryClient.invalidateQueries({ queryKey: calendarKeys.all })
    },
  })
}
