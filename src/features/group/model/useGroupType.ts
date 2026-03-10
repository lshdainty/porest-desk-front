import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { groupTypeKeys, groupKeys } from '@/shared/config'
import { groupTypeApi } from '../api/groupTypeApi'
import type { GroupTypeFormValues } from '@/entities/group'

export const useGroupTypes = () => {
  return useQuery({
    queryKey: groupTypeKeys.list(),
    queryFn: () => groupTypeApi.getGroupTypes(),
  })
}

export const useCreateGroupType = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: GroupTypeFormValues) => groupTypeApi.createGroupType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupTypeKeys.all })
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
    },
  })
}

export const useUpdateGroupType = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: GroupTypeFormValues }) =>
      groupTypeApi.updateGroupType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupTypeKeys.all })
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
    },
  })
}

export const useDeleteGroupType = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => groupTypeApi.deleteGroupType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupTypeKeys.all })
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
    },
  })
}
