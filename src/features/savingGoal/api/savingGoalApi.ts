import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type {
  SavingGoal,
  SavingGoalFormValues,
  SavingGoalUpdateFormValues,
  SavingGoalContributeValues,
  SavingGoalReorderItem,
} from '@/entities/savingGoal'

export const savingGoalApi = {
  createSavingGoal: async (data: SavingGoalFormValues): Promise<SavingGoal> => {
    const resp: ApiResponse<SavingGoal> = await apiClient.post('/v1/saving-goal', data)
    return resp.data
  },

  getSavingGoals: async (): Promise<{ goals: SavingGoal[] }> => {
    const resp: ApiResponse<{ goals: SavingGoal[] }> = await apiClient.get('/v1/saving-goals')
    return resp.data
  },

  getSavingGoal: async (id: number): Promise<SavingGoal> => {
    const resp: ApiResponse<SavingGoal> = await apiClient.get(`/v1/saving-goal/${id}`)
    return resp.data
  },

  updateSavingGoal: async (id: number, data: SavingGoalUpdateFormValues): Promise<SavingGoal> => {
    const resp: ApiResponse<SavingGoal> = await apiClient.put(`/v1/saving-goal/${id}`, data)
    return resp.data
  },

  contributeSavingGoal: async (id: number, data: SavingGoalContributeValues): Promise<SavingGoal> => {
    const resp: ApiResponse<SavingGoal> = await apiClient.patch(`/v1/saving-goal/${id}/contribute`, data)
    return resp.data
  },

  deleteSavingGoal: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/saving-goal/${id}`)
    return resp.data
  },

  reorderSavingGoals: async (items: SavingGoalReorderItem[]): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.patch('/v1/saving-goals/reorder', { items })
    return resp.data
  },
}
