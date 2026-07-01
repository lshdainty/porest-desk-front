/**
 * 소셜 계정 연동(OAuth link) API. 설정 '연결된 계정'에서 사용.
 * desk-back(/api) 이 SSO 로 연동 티켓을 받아 startUrl 을 돌려주고, 브라우저가 거기로 이동해
 * SSO→Google→연동 후 다시 설정 페이지로 ?linked=<provider> / ?linkError=<msg> 를 달고 복귀한다.
 * 전부 desk 쿠키 인증(apiClient withCredentials).
 */
import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'

export interface ProviderInfo {
  /** 대문자 provider 타입 (예: "GOOGLE") */
  type: string
  /** 표시 이름 (예: "Google") */
  name: string
  /** SSO 인가 URL */
  authUrl: string
  /** 현재 사용자와 연동됨 여부 */
  linked: boolean
}

export const oauthLinkApi = {
  getProviders: async (): Promise<ProviderInfo[]> => {
    const resp: ApiResponse<ProviderInfo[]> = await apiClient.get('/v1/oauth/providers')
    return resp.data
  },

  startLink: async (provider: string, returnUrl: string): Promise<{ startUrl: string }> => {
    const resp: ApiResponse<{ startUrl: string }> = await apiClient.post(
      `/v1/oauth/link/${provider}`,
      { returnUrl },
    )
    return resp.data
  },

  unlink: async (provider: string): Promise<void> => {
    await apiClient.delete(`/v1/oauth/link/${provider}`)
  },
}
