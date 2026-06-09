import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userCalendarKeys } from '@/shared/config/queryKeys'
import { userCalendarApi } from '../api/userCalendarApi'
import type { UserCalendarFormValues, CalendarRole } from '@/entities/user-calendar'

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

// ── 공유 ──

export const useCalendarMembers = (id: number | null) => {
  return useQuery({
    queryKey: [...userCalendarKeys.all, 'members', id],
    queryFn: () => userCalendarApi.getMembers(id as number),
    enabled: id != null,
  })
}

export const useRegenerateCalendarInviteCode = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => userCalendarApi.regenerateInviteCode(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userCalendarKeys.all }),
  })
}

export const useJoinCalendar = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (inviteCode: string) => userCalendarApi.joinByCode(inviteCode),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userCalendarKeys.all }),
  })
}

export const useRemoveCalendarMember = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, memberId }: { id: number; memberId: number }) =>
      userCalendarApi.removeMember(id, memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userCalendarKeys.all }),
  })
}

export const useChangeCalendarMemberRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, memberId, permission }: { id: number; memberId: number; permission: CalendarRole }) =>
      userCalendarApi.changeMemberRole(id, memberId, permission),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userCalendarKeys.all }),
  })
}
