import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { Spinner } from '@/shared/ui/spinner'
import { config } from '@/shared/config'
import { hasToken } from '@/shared/api'
import { useTheme } from '@/shared/ui/theme-provider'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { cn } from '@/shared/lib'
import loginBG from '@/shared/assets/img/login_bg.png'
import Logo from '@/shared/assets/img/porest.svg'
import LogoDark from '@/shared/assets/img/porest_dark.svg'

export const LoginPage = () => {
  if (hasToken()) {
    return <Navigate to="/desk" replace />
  }

  return (
    <div className="bg-muted min-h-svh grid items-center p-6 md:p-10">
      {/* Mobile: Card 없이 viewport 가운데 form 만 — 디자인 정상 시각 */}
      <div className="w-full max-w-sm md:hidden mx-auto">
        <LoginForm />
      </div>
      {/* Desktop (md+): Card + 2-column grid (이미지 + form) */}
      <div className="hidden md:block w-full max-w-6xl mx-auto">
        <div className={cn('flex flex-col gap-6 h-[700px]')}>
          <Card className="overflow-hidden h-full" style={{ padding: 0 }}>
            <CardContent
              className="grid grid-cols-[2fr_1fr] h-full"
              style={{ padding: 0 }}
            >
              <div className="bg-muted relative">
                <img
                  src={loginBG}
                  alt="Desk workspace"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
              <div className="p-8 h-full flex justify-center">
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
  const { resolvedTheme } = useTheme()
  const [isRedirecting, setIsRedirecting] = useState(false)

  const handleSsoRedirect = () => {
    setIsRedirecting(true)
    const callbackUrl = `${window.location.origin}/auth/callback`
    const ssoLoginUrl = `${config.ssoUrl}/login?redirect_uri=${encodeURIComponent(callbackUrl)}`
    window.location.href = ssoLoginUrl
  }

  return (
    <div className="w-full">
      <div className="flex flex-col justify-center gap-6">
        <div className="flex flex-col items-center text-center w-full">
          <img
            src={resolvedTheme === 'light' ? Logo : LogoDark}
            alt="POREST Desk"
            className="h-20 w-auto"
          />
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
