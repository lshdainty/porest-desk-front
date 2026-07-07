import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { CircleCheck, Eye, EyeOff, Link2 } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Field, FieldLabel } from '@/shared/ui/field'
import {
  useTossCredentialStatus,
  useRegisterTossCredential,
  useDisconnectTossCredential,
} from '@/features/subscription/model/useSubscription'

/**
 * 증권 데이터 연동 — 토스증권 API 키 연결 카드.
 * 구독(Pro) 시 계정 설정의 '구독·결제' 아래에 노출. 본인 키 등록 시 보유·시세 자동 수집.
 * client_secret 은 서버에 암호화 저장되며 응답으로 반환되지 않는다(연결 여부만 표시).
 */
export function TossConnectCard() {
  const { t } = useTranslation('subscription')
  const credQ = useTossCredentialStatus()
  const register = useRegisterTossCredential()
  const disconnect = useDisconnectTossCredential()

  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)

  const connected = credQ.data?.connected ?? false
  const verifiedAt = credQ.data?.verifiedAt ?? null
  const canConnect = clientId.trim().length > 0 && clientSecret.trim().length > 0

  const onConnect = () => {
    if (!canConnect) return
    register.mutate(
      { clientId: clientId.trim(), clientSecret: clientSecret.trim() },
      {
        onSuccess: () => {
          toast(t('toss.toastConnected'))
          setClientId('')
          setClientSecret('')
        },
        onError: () => toast.error(t('toss.toastInvalid')),
      },
    )
  }
  const onDisconnect = () =>
    disconnect.mutate(undefined, {
      onSuccess: () => toast(t('toss.toastDisconnected')),
      onError: () => toast.error(t('toss.toastDisconnectFailed')),
    })

  return (
    <div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--fg-primary)',
          paddingBottom: 8,
          paddingLeft: 2,
        }}
      >
        {t('toss.title')}
      </div>
      <Card variant="bordered" style={{ padding: 0, overflow: 'hidden' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px 16px 14px' }}>
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              flexShrink: 0,
              background: 'var(--bg-brand-subtle)',
              color: 'var(--fg-brand)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Link2 size={18} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-primary)', letterSpacing: '-0.01em' }}>
              {t('toss.connectTitle')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 3, lineHeight: 1.5 }}>
              {t('toss.connectDesc')}
            </div>
          </div>
          {connected && (
            <Badge variant="success" style={{ flexShrink: 0 }}>
              {t('toss.connected')}
            </Badge>
          )}
        </div>

        {connected ? (
          <div style={{ padding: '0 16px 16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-canvas)',
              }}
            >
              <CircleCheck size={18} style={{ color: 'var(--status-success-fg)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' }}>{t('toss.keyConnected')}</div>
                <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
                  {verifiedAt ? t('toss.lastVerified', { date: verifiedAt.slice(0, 10) }) : t('toss.autoCollecting')}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={onDisconnect} loading={disconnect.isPending}>
                {t('toss.disconnect')}
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field>
              <FieldLabel>Client ID</FieldLabel>
              <Input
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                placeholder={t('toss.clientIdPlaceholder')}
                autoComplete="off"
                spellCheck={false}
                className="w-full"
              />
            </Field>
            <Field>
              <FieldLabel>Client Secret</FieldLabel>
              <div style={{ position: 'relative' }}>
                <Input
                  type={showSecret ? 'text' : 'password'}
                  value={clientSecret}
                  onChange={e => setClientSecret(e.target.value)}
                  placeholder="Client Secret"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full"
                  style={{ paddingRight: 40 }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSecret(v => !v)}
                  aria-label={t('toss.toggleSecret')}
                  style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', height: 32, width: 32 }}
                >
                  {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
            </Field>
            <Button
              size="md"
              onClick={onConnect}
              loading={register.isPending}
              disabled={!canConnect}
              style={{ width: '100%' }}
            >
              {t('toss.connect')}
            </Button>
            <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', lineHeight: 1.5 }}>
              {t('toss.keyHint')}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
