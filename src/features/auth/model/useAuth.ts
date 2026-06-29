import { useState, useCallback } from 'react'
import { authApi } from '../api/authApi'
import { setAuthenticated, clearAuthenticated } from '@/shared/api'

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const exchangeToken = useCallback(async (ssoToken: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await authApi.exchangeToken(ssoToken)
      setAuthenticated()
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Token exchange failed'
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const exchangeCode = useCallback(
    async (params: { code: string; codeVerifier: string; redirectUri: string }) => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await authApi.exchangeCode(params)
        setAuthenticated()
        return response
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Code exchange failed'
        setError(message)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // 로그아웃 API 실패해도 클라이언트 상태는 정리
    }
    clearAuthenticated()
    window.location.href = '/login'
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { exchangeToken, exchangeCode, logout, isLoading, error, clearError }
}
