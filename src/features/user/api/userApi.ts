import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'

export interface ChangePasswordReq {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export const userApi = {
  changePassword: async (data: ChangePasswordReq): Promise<void> => {
    const resp: ApiResponse = await apiClient.patch('/v1/users/me/password', data)
    if (!resp.success) throw new Error(resp.message)
  },
}
