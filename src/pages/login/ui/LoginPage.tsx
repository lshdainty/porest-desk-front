import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { Spinner } from '@/shared/ui/spinner'
import { config } from '@/shared/config'
import { hasToken } from '@/shared/api'
import { generateCodeVerifier, codeChallenge, generateState, savePkce } from '@/features/auth/lib/pkce'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { cn } from '@/shared/lib'
import loginBG from '@/shared/assets/img/login_bg.png'

/** 브랜드 마크(rect 4단 나무) — 인라인 svg 라 fg-brand 토큰으로 다크 자동 전환. */
function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="var(--fg-brand)" aria-hidden>
      <rect x="39" y="18" width="22" height="12" rx="6" />
      <rect x="30" y="36" width="40" height="12" rx="6" />
      <rect x="21" y="54" width="58" height="12" rx="6" />
      <rect x="44.5" y="72" width="11" height="10" rx="5" />
    </svg>
  )
}

export const LoginPage = () => {
  if (hasToken()) {
    return <Navigate to="/desk" replace />
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full md:max-w-6xl">
        <div className={cn('flex flex-col gap-6 h-[700px]')}>
          <Card className="overflow-hidden p-0 h-full">
            <CardContent className="grid p-0 md:p-0 md:grid-cols-[2fr_1fr] h-full">
              <div className="bg-muted relative hidden md:block">
                <img
                  src={loginBG}
                  alt="Desk workspace"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
              <div className="p-6 md:p-8 h-full flex justify-center">
                <div className="flex flex-col justify-center gap-6 w-full">
                  <LoginForm />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

const LoginForm = () => {
  const { t } = useTranslation('login')
  const [isRedirecting, setIsRedirecting] = useState(false)

  const handleSsoRedirect = async () => {
    setIsRedirecting(true)
    const callbackUrl = `${window.location.origin}/auth/callback`
    // PKCE: code_verifier/state 생성 후 보관, code_challenge(S256) 을 인가 요청에 첨부.
    const verifier = generateCodeVerifier()
    const state = generateState()
    savePkce(verifier, state)
    const challenge = await codeChallenge(verifier)
    const params = new URLSearchParams({
      redirect_uri: callbackUrl,
      client_id: 'desk',
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state,
    })
    window.location.href = `${config.ssoUrl}/login?${params.toString()}`
  }

  return (
    <div className="w-full">
      <div className="flex flex-col justify-center gap-6">
        {/* 앱 로그인 레이아웃 정합 — 마크(아이콘)만 좌측 + 'Porest Desk' 는 실제 텍스트(합성 이미지 금지). */}
        <div className="flex items-center justify-center gap-3">
          <BrandMark size={40} />
          <span
            style={{
              fontSize: 'var(--text-display-md)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--fg-primary)',
            }}
          >
            Porest Desk
          </span>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground mb-6">
            {t('sso.description')}
          </p>
          <Button
            type="button"
            className="w-full"
            size="lg"
            onClick={handleSsoRedirect}
            disabled={isRedirecting}
          >
            {isRedirecting && <Spinner size="sm" className="mr-2" />}
            {isRedirecting ? t('sso.redirecting') : t('sso.login')}
          </Button>
        </div>
        <div className="text-center text-sm text-muted-foreground">
          <p>{t('sso.notice')}</p>
        </div>
      </div>
    </div>
  )
}
