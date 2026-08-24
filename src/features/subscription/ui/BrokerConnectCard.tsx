import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { CircleCheck, Eye, EyeOff, Link2 } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Field, FieldLabel } from '@/shared/ui/field'
import type { BrokerConnection } from '@/features/subscription/api/subscriptionApi'
import {
  useRegisterBrokerCredential,
  useDisconnectBrokerCredential,
  useSetPrimaryBroker,
} from '@/features/subscription/model/useSubscription'

/**
 * 증권사 한 곳의 연결 카드 — 키 등록 / 해제 / 기본 시세 소스 지정.
 *
 * **증권사 이름을 프론트에 박지 않는다.** 표시명·발급처·입력 라벨은 서버가 주는
 * `BrokerConnection` 에서 온다. 증권사가 늘어도 배포 없이 목록에 나타나고, 같은 자리를
 * 회사마다 다르게 부르는 문제(토스 Client ID / 나무 App Key)도 여기서 풀린다.
 *
 * 시크릿은 서버에 암호화 저장되며 응답으로 반환되지 않는다(연결 여부만 표시).
 */
export function BrokerConnectCard({
  connection,
  showPrimaryAction,
}: {
  connection: BrokerConnection
  /** 기본 시세 소스 지정 버튼 노출 여부. 연결이 하나뿐이면 고를 게 없어 감춘다. */
  showPrimaryAction: boolean
}) {
  const { t } = useTranslation('subscription')
  const register = useRegisterBrokerCredential()
  const disconnect = useDisconnectBrokerCredential()
  const setPrimary = useSetPrimaryBroker()

  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)

  const { broker, displayName, connected, primary, verifiedAt } = connection
  const canConnect = apiKey.trim().length > 0 && apiSecret.trim().length > 0

  const onConnect = () => {
    if (!canConnect) return
    register.mutate(
      { broker, apiKey: apiKey.trim(), apiSecret: apiSecret.trim() },
      {
        onSuccess: () => {
          toast.success(t('broker.toastConnected', { broker: displayName }))
          setApiKey('')
          setApiSecret('')
        },
        onError: () => toast.error(t('broker.toastInvalid')),
      },
    )
  }

  const onDisconnect = () =>
    disconnect.mutate(broker, {
      onSuccess: () => toast.success(t('broker.toastDisconnected', { broker: displayName })),
      onError: () => toast.error(t('broker.toastDisconnectFailed')),
    })

  const onSetPrimary = () =>
    setPrimary.mutate(broker, {
      onSuccess: () => toast.success(t('broker.toastPrimaryChanged', { broker: displayName })),
      onError: () => toast.error(t('broker.toastPrimaryFailed')),
    })

  return (
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
            {displayName}
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 3, lineHeight: 1.5 }}>
            {t('broker.connectDesc')}
          </div>
        </div>
        {primary ? (
          /* 앱은 softBrand 를 쓰지만 front Badge spec 에는 soft-brand 가 없다 — solid default 로 둔다. */
          <Badge variant="default" style={{ flexShrink: 0 }}>
            {t('broker.primary')}
          </Badge>
        ) : connected ? (
          <Badge variant="success" style={{ flexShrink: 0 }}>
            {t('broker.connected')}
          </Badge>
        ) : null}
      </div>

      {connected ? (
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
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
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' }}>
                {t('broker.keyConnected', { broker: displayName })}
              </div>
              <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
                {verifiedAt
                  ? t('broker.lastVerified', { date: verifiedAt.slice(0, 10) })
                  : t('broker.autoCollecting')}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onDisconnect} loading={disconnect.isPending}>
              {t('broker.disconnect')}
            </Button>
          </div>

          {/* 연결이 둘 이상일 때만 고를 의미가 있다. */}
          {showPrimaryAction && !primary && (
            <>
              <Button
                variant="outline"
                size="md"
                onClick={onSetPrimary}
                loading={setPrimary.isPending}
                style={{ width: '100%' }}
              >
                {t('broker.useAsPrimary')}
              </Button>
              <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', lineHeight: 1.5 }}>
                {t('broker.primaryHint')}
              </div>
            </>
          )}
        </div>
      ) : (
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 라벨은 서버가 준다 — 회사마다 같은 자리를 다르게 부른다. */}
          <Field>
            <FieldLabel>{connection.keyLabel}</FieldLabel>
            <Input
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={connection.keyLabel}
              autoComplete="off"
              spellCheck={false}
              className="w-full"
            />
          </Field>
          <Field>
            <FieldLabel>{connection.secretLabel}</FieldLabel>
            <div style={{ position: 'relative' }}>
              <Input
                type={showSecret ? 'text' : 'password'}
                value={apiSecret}
                onChange={e => setApiSecret(e.target.value)}
                placeholder={connection.secretLabel}
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
                aria-label={t('broker.toggleSecret')}
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
            {t('broker.connect')}
          </Button>
          <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', lineHeight: 1.5 }}>
            {t('broker.keyHint', { broker: displayName })}
          </div>
        </div>
      )}
    </Card>
  )
}
