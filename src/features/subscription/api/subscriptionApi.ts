/**
 * 구독·기능권한·토스 크리덴셜 API. 증권 기능 게이트(메뉴 노출)와 설정(토스 연결)의 백엔드 연동.
 */
import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'

export interface MyFeatures {
  /** 활성 기능권한 코드 (예: ["SECURITIES"]) */
  features: string[]
  /** 토스증권 크리덴셜 연결 여부 */
  tossConnected: boolean
}

export interface SubscriptionInfo {
  planCode: string
  planName: string
  status: string
  startedAt: string
  currentPeriodEnd: string | null
  autoRenew: boolean
}

export interface TossCredentialStatus {
  connected: boolean
  verified: boolean
  verifiedAt: string | null
}

export const subscriptionApi = {
  getMyFeatures: async (): Promise<MyFeatures> => {
    const resp: ApiResponse<MyFeatures> = await apiClient.get('/v1/users/me/features')
    return resp.data
  },

  getMySubscription: async (): Promise<SubscriptionInfo | null> => {
    const resp: ApiResponse<SubscriptionInfo | null> = await apiClient.get('/v1/subscriptions/me')
    return resp.data
  },

  subscribe: async (planCode: string): Promise<SubscriptionInfo> => {
    const resp: ApiResponse<SubscriptionInfo> = await apiClient.post('/v1/subscriptions', { planCode })
    return resp.data
  },

  cancelSubscription: async (reason?: string): Promise<void> => {
    await apiClient.delete('/v1/subscriptions/me', { data: { reason } })
  },

  getTossCredentialStatus: async (): Promise<TossCredentialStatus> => {
    const resp: ApiResponse<TossCredentialStatus> = await apiClient.get('/v1/users/me/toss-credential')
    return resp.data
  },

  registerTossCredential: async (clientId: string, clientSecret: string): Promise<void> => {
    await apiClient.post('/v1/users/me/toss-credential', { clientId, clientSecret })
  },

  disconnectTossCredential: async (): Promise<void> => {
    await apiClient.delete('/v1/users/me/toss-credential')
  },
}
