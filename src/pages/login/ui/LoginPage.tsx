import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { Spinner } from '@/shared/ui/spinner'
import { config } from '@/shared/config'
import { hasToken } from '@/shared/api'
import { generateCodeVerifier, codeChallenge, generateState, savePkce } from '@/features/auth/lib/pkce'
import { Button } from '@/shared/ui/button'
import { BrandMark } from '@/shared/ui/brand-mark'

export const LoginPage = () => {
  if (hasToken()) {
    return <Navigate to="/desk" replace />
  }

  return (
    // 앱 로그인 정합(사용자 결정) — 카드/이미지 패널 없이 통일 배경(bg-surface) 중앙 콘텐츠만.
    <div
      className="flex min-h-svh flex-col items-center justify-center p-6"
      style={{ background: 'var(--bg-surface)' }}
    >
      {/* max-w-sm 금지 — porest --spacing-sm(8px) 이 Tailwind 스케일을 가려 8px 로 컴파일됨. */}
      <div className="w-full max-w-[24rem]">
        <LoginForm />
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
    // 묶음 구조(사용자 결정) — [로고+타이틀+안내문] 한 묶음(내부 gap 8, 앱 x8) ↔ 버튼을
    // gap 32(앱 x32)로 분리.
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        {/* 마크(아이콘)만 좌측 + 'Porest Desk' 는 실제 텍스트(합성 이미지 금지). 마크 56 / gap 0. */}
        <div className="flex items-center justify-center">
          <BrandMark size={56} />
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
        <p className="text-muted-foreground">{t('sso.description')}</p>
      </div>
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
  )
}
