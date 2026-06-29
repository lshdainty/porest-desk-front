import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { getCodeVerifier, getSavedState, clearPkce } from '@/features/auth/lib/pkce'
import { Spinner } from '@/shared/ui/spinner'

export const AuthCallbackPage = () => {
  const navigate = useNavigate()
  const { exchangeToken, exchangeCode } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      const query = new URLSearchParams(window.location.search)
      const code = query.get('code')

      // 신규: OAuth2 Authorization Code + PKCE (?code=&state=)
      if (code) {
        const returnedState = query.get('state')
        const savedState = getSavedState()
        const verifier = getCodeVerifier()
        // verifier 없거나 state(CSRF) 불일치 시 거부
        if (!verifier || (savedState && returnedState && savedState !== returnedState)) {
          clearPkce()
          navigate('/login', { replace: true })
          return
        }
        const redirectUri = `${window.location.origin}/auth/callback`
        const result = await exchangeCode({ code, codeVerifier: verifier, redirectUri })
        clearPkce()
        window.history.replaceState({}, '', window.location.pathname)
        navigate(result ? '/desk' : '/login', { replace: true })
        return
      }

      // 기존(병행): fragment 로 받은 SSO 토큰 (#token=)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const ssoToken = hashParams.get('token')
      if (!ssoToken) {
        navigate('/login', { replace: true })
        return
      }
      const result = await exchangeToken(ssoToken)
      window.history.replaceState({}, '', window.location.pathname)
      navigate(result ? '/desk' : '/login', { replace: true })
    }

    handleCallback()
  }, [exchangeToken, exchangeCode, navigate])

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground">인증 중…</p>
    </div>
  )
}
