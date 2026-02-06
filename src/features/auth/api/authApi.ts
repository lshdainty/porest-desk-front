import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { TokenExchangeResponse, LoginCheckResponse } from '@/entities/session'

export const authApi = {
  exchangeToken: async (ssoToken: string): Promise<TokenExchangeResponse> => {
    const resp: ApiResponse<TokenExchangeResponse> = await apiClient.post('/v1/auth/exchange', { ssoToken })
    return resp.data
  },
  loginCheck: async (): Promise<LoginCheckResponse> => {
    const resp: ApiResponse<LoginCheckResponse> = await apiClient.get('/v1/auth/check')
    return resp.data
  },
}
