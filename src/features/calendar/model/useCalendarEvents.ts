import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { calendarKeys } from '@/shared/config'
import { calendarApi } from '../api/calendarApi'
import type { CalendarEventFormValues } from '@/entities/calendar'

export const useCalendarEvents = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: calendarKeys.events({ startDate, endDate }),
    queryFn: () => calendarApi.getEvents(startDate, endDate),
    enabled: !!startDate && !!endDate,
  })
}

export const useCreateEvent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CalendarEventFormValues) => calendarApi.createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all })
    },
  })
}

export const useUpdateEvent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number, data: CalendarEventFormValues }) =>
      calendarApi.updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all })
    },
  })
}

export const useDeleteEvent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => calendarApi.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all })
    },
  })
}
