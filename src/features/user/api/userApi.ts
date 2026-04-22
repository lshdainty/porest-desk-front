import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'

export interface ChangePasswordReq {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface UserPreferences {
  budgetAlertThreshold: number
}

export const userApi = {
  changePassword: async (data: ChangePasswordReq): Promise<void> => {
    const resp: ApiResponse = await apiClient.patch('/v1/users/me/password', data)
    if (!resp.success) throw new Error(resp.message)
  },

  getPreferences: async (): Promise<UserPreferences> => {
    const resp: ApiResponse<UserPreferences> = await apiClient.get('/v1/users/me/preferences')
    return resp.data
  },

  updatePreferences: async (data: Partial<UserPreferences>): Promise<UserPreferences> => {
    const resp: ApiResponse<UserPreferences> = await apiClient.patch('/v1/users/me/preferences', data)
    return resp.data
  },
}
