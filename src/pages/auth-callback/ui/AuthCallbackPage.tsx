import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'

export const AuthCallbackPage = () => {
  const navigate = useNavigate()
  const { exchangeToken } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      const hash = window.location.hash
      const params = new URLSearchParams(hash.substring(1))
      const ssoToken = params.get('token')

      if (!ssoToken) {
        navigate('/login', { replace: true })
        return
      }

      const result = await exchangeToken(ssoToken)
      window.history.replaceState({}, '', window.location.pathname)

      if (result) {
        navigate('/desk', { replace: true })
      } else {
        navigate('/login', { replace: true })
      }
    }

    handleCallback()
  }, [exchangeToken, navigate])

  return (
    <div className="flex h-screen items-center justify-center">
      <p>Authenticating...</p>
    </div>
  )
}
