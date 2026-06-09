import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'

export interface ChangePasswordReq {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export type NotificationSound = 'CHIME' | 'DEFAULT' | 'NONE'
export type EmailFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY'

export interface UserPreferences {
  /** 마스터 토글 */
  pushEnabled: boolean
  /** 결제 알림 */
  notifyPayment: boolean
  /** 예산 알림 */
  notifyBudget: boolean
  /** 자동 기록 알림 */
  notifyAutoRecord: boolean
  /** 더치페이 알림 */
  notifyDutchPay: boolean
  /** 일정 알림 */
  notifyCalendar: boolean
  /** 주간 리포트 */
  notifyWeeklyReport: boolean
  /** 월간 리포트 */
  notifyMonthlyReport: boolean
  /** 예산 임계값 50~100 */
  budgetAlertThreshold: number
  /** 방해 금지 사용 */
  quietHoursEnabled: boolean
  /** 방해 금지 시작 "HH:mm" 24h */
  quietHoursStart: string
  /** 방해 금지 종료 "HH:mm" 24h */
  quietHoursEnd: string
  /** 알림음 */
  notificationSound: NotificationSound
  /** 진동 */
  vibrationEnabled: boolean
  /** 이메일 수신 */
  emailEnabled: boolean
  /** 발송 주기 */
  emailFrequency: EmailFrequency
}

export const userApi = {
  changePassword: async (data: ChangePasswordReq): Promise<void> => {
    const resp: ApiResponse = await apiClient.patch('/v1/users/me/password', data)
    if (!resp.success) throw new Error(resp.message)
  },

  verifyPassword: async (password: string): Promise<void> => {
    const resp: ApiResponse = await apiClient.post('/v1/users/me/verify-password', { password })
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
