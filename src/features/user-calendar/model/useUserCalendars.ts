import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userCalendarKeys } from '@/shared/config/queryKeys'
import { userCalendarApi } from '../api/userCalendarApi'
import type { UserCalendarFormValues } from '@/entities/user-calendar'

export const useUserCalendars = () => {
  return useQuery({
    queryKey: userCalendarKeys.list(),
    queryFn: () => userCalendarApi.getCalendars(),
  })
}

export const useCreateUserCalendar = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UserCalendarFormValues) => userCalendarApi.createCalendar(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userCalendarKeys.all })
    },
  })
}

export const useUpdateUserCalendar = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserCalendarFormValues }) =>
      userCalendarApi.updateCalendar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userCalendarKeys.all })
    },
  })
}

export const useToggleCalendarVisibility = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => userCalendarApi.toggleVisibility(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userCalendarKeys.all })
    },
  })
}

export const useDeleteUserCalendar = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => userCalendarApi.deleteCalendar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userCalendarKeys.all })
    },
  })
}
