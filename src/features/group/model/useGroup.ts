import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { groupKeys } from '@/shared/config'
import { groupApi } from '../api/groupApi'
import type { GroupFormValues, GroupRole } from '@/entities/group'

export const useGroups = () => {
  return useQuery({
    queryKey: groupKeys.list(),
    queryFn: () => groupApi.getGroups(),
  })
}

export const useGroup = (id: number) => {
  return useQuery({
    queryKey: groupKeys.detail(id),
    queryFn: () => groupApi.getGroup(id),
    enabled: id > 0,
  })
}

export const useCreateGroup = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: GroupFormValues) => groupApi.createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
    },
  })
}

export const useUpdateGroup = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: GroupFormValues }) =>
      groupApi.updateGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
    },
  })
}

export const useDeleteGroup = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => groupApi.deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
    },
  })
}

export const useRegenerateInviteCode = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => groupApi.regenerateInviteCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
    },
  })
}

export const useJoinGroup = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (inviteCode: string) => groupApi.joinGroup(inviteCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
    },
  })
}

export const useRemoveMember = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ groupId, memberId }: { groupId: number; memberId: number }) =>
      groupApi.removeMember(groupId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
    },
  })
}

export const useChangeMemberRole = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      groupId,
      memberId,
      role,
    }: {
      groupId: number
      memberId: number
      role: GroupRole
    }) => groupApi.changeMemberRole(groupId, memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
    },
  })
}

export const useGroupEvents = (groupId: number, startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['group', groupId, 'events', startDate, endDate],
    queryFn: async () => {
      const response = await groupApi.getGroupEvents(groupId, startDate, endDate)
      return response.data
    },
    enabled: !!groupId,
  })
}

export const useGroupExpenses = (groupId: number, params?: { startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ['group', groupId, 'expenses', params],
    queryFn: async () => {
      const response = await groupApi.getGroupExpenses(groupId, params)
      return response.data
    },
    enabled: !!groupId,
  })
}
