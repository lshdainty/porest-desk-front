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
}
