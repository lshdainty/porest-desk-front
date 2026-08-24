/**
 * 구독·기능권한·증권사 크리덴셜 API. 증권 기능 게이트(메뉴 노출)와 설정(증권사 연결)의 백엔드 연동.
 */
import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'

export interface MyFeatures {
  /** 활성 기능권한 코드 (예: ["SECURITIES"]) */
  features: string[]
  /** 연결된 증권사 코드. 증권사가 늘어도 이 배열만 늘어난다 */
  connectedBrokers: string[]
  /** 가계부 자산 평가에 쓰는 증권사. 연결이 없으면 null */
  primaryBroker: string | null
  /** @deprecated 구버전 호환용 파생값 — 새 코드는 connectedBrokers 를 봐라 */
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

/**
 * 증권사 한 곳의 연결 상태 + 입력 폼 라벨.
 *
 * 표시명·발급처·라벨을 **서버가 준다.** 증권사가 늘어도 프론트 배포 없이 목록에 나타나고,
 * 같은 자리를 회사마다 다르게 부르는 문제(토스 Client ID / 나무 App Key)도 여기서 풀린다.
 */
export interface BrokerConnection {
  broker: string
  displayName: string
  issueUrl: string
  keyLabel: string
  secretLabel: string
  connected: boolean
  verified: boolean
  primary: boolean
  verifiedAt: string | null
}

export interface SubscriptionPlan {
  planCode: string
  planName: string
  durationMonths: number | null
}

export const subscriptionApi = {
  getMyFeatures: async (): Promise<MyFeatures> => {
    const resp: ApiResponse<MyFeatures> = await apiClient.get('/v1/users/me/features')
    return resp.data
  },

  getPlans: async (): Promise<SubscriptionPlan[]> => {
    const resp: ApiResponse<SubscriptionPlan[]> = await apiClient.get('/v1/subscriptions/plans')
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

  /** 전 증권사 연결 상태 — 미연결 증권사도 포함해 화면이 목록을 그린다. */
  getBrokerConnections: async (): Promise<BrokerConnection[]> => {
    const resp: ApiResponse<BrokerConnection[]> = await apiClient.get('/v1/users/me/securities-credentials')
    return resp.data ?? []
  },

  registerBrokerCredential: async (broker: string, apiKey: string, apiSecret: string): Promise<void> => {
    await apiClient.post(`/v1/users/me/securities-credentials/${broker}`, { apiKey, apiSecret })
  },

  disconnectBrokerCredential: async (broker: string): Promise<void> => {
    await apiClient.delete(`/v1/users/me/securities-credentials/${broker}`)
  },

  /** 가계부 자산 평가에 쓸 증권사를 지정한다. */
  setPrimaryBroker: async (broker: string): Promise<void> => {
    await apiClient.put(`/v1/users/me/securities-credentials/${broker}/primary`)
  },
}
