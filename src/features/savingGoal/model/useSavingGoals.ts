import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { savingGoalKeys } from '@/shared/config'
import { savingGoalApi } from '../api/savingGoalApi'
import type {
  SavingGoalFormValues,
  SavingGoalUpdateFormValues,
  SavingGoalContributeValues,
  SavingGoalReorderItem,
} from '@/entities/savingGoal'

export const useSavingGoals = () => {
  return useQuery({
    queryKey: savingGoalKeys.list(),
    queryFn: () => savingGoalApi.getSavingGoals(),
  })
}

export const useSavingGoal = (id: number) => {
  return useQuery({
    queryKey: savingGoalKeys.detail(id),
    queryFn: () => savingGoalApi.getSavingGoal(id),
    enabled: id > 0,
  })
}

export const useCreateSavingGoal = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SavingGoalFormValues) => savingGoalApi.createSavingGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savingGoalKeys.all })
    },
  })
}

export const useUpdateSavingGoal = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SavingGoalUpdateFormValues }) =>
      savingGoalApi.updateSavingGoal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savingGoalKeys.all })
    },
  })
}

export const useContributeSavingGoal = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SavingGoalContributeValues }) =>
      savingGoalApi.contributeSavingGoal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savingGoalKeys.all })
    },
  })
}

export const useDeleteSavingGoal = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => savingGoalApi.deleteSavingGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savingGoalKeys.all })
    },
  })
}

export const useReorderSavingGoals = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (items: SavingGoalReorderItem[]) => savingGoalApi.reorderSavingGoals(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savingGoalKeys.all })
    },
  })
}
