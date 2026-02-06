import { useEffect } from 'react'
import { config } from '@/shared/config'
import { hasToken } from '@/shared/api'
import { useNavigate } from 'react-router-dom'

export const LoginPage = () => {
  const navigate = useNavigate()

  useEffect(() => {
    if (hasToken()) {
      navigate('/desk', { replace: true })
      return
    }
    const callbackUrl = `${window.location.origin}/auth/callback`
    const ssoLoginUrl = `${config.ssoUrl}/login?redirect_uri=${encodeURIComponent(callbackUrl)}`
    window.location.href = ssoLoginUrl
  }, [navigate])

  return (
    <div className="flex h-screen items-center justify-center">
      <p>Redirecting to login...</p>
    </div>
  )
}
