import { useState, useCallback } from 'react'
import { authApi } from '../api/authApi'
import { setToken, removeToken } from '@/shared/api'

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const exchangeToken = useCallback(async (ssoToken: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await authApi.exchangeToken(ssoToken)
      setToken(response.accessToken)
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Token exchange failed'
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    removeToken()
    window.location.href = '/login'
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { exchangeToken, logout, isLoading, error, clearError }
}
