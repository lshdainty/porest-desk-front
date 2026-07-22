export interface TokenExchangeRequest {
  ssoToken: string
}

export interface TokenExchangeResponse {
  accessToken: string
  userId: string
  userName: string
  userEmail: string
}

export interface LoginCheckResponse {
  rowId: number
  userId: string
  userName: string
  userEmail: string
  timezone: string
  /** 가입 시각(ISO) — desk-back /auth/check joinedAt (core AuditingFields). 구백엔드 호환 optional. */
  joinedAt?: string | null
}
