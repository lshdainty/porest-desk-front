import { useState } from 'react'
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
          toast('토스증권이 연결되었어요')
          setClientId('')
          setClientSecret('')
        },
        onError: () => toast.error('인증정보가 올바르지 않아요'),
      },
    )
  }
  const onDisconnect = () =>
    disconnect.mutate(undefined, {
      onSuccess: () => toast('토스증권 연결을 해제했어요'),
      onError: () => toast.error('해제에 실패했어요'),
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
        증권 데이터 연동
      </div>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px 18px 14px' }}>
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              flexShrink: 0,
              background: 'color-mix(in oklab, var(--color-chart-blue) 14%, var(--bg-surface))',
              color: 'var(--color-chart-blue)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Link2 size={18} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-primary)', letterSpacing: '-0.01em' }}>
              토스증권 연결
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 3, lineHeight: 1.5 }}>
              본인 API 키를 등록하면 보유 주식·시세를 자동으로 가져와요
            </div>
          </div>
          {connected && (
            <Badge variant="secondary" style={{ flexShrink: 0 }}>
              연결됨
            </Badge>
          )}
        </div>

        {connected ? (
          <div style={{ padding: '0 18px 18px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-sunken)',
              }}
            >
              <CircleCheck size={18} style={{ color: 'var(--status-success-fg)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' }}>본인 API 키 사용 중</div>
                <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginTop: 2 }}>
                  {verifiedAt ? `검증 완료 · ${verifiedAt.slice(0, 10)}` : '검증 완료'}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={onDisconnect} loading={disconnect.isPending}>
                연결 해제
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field>
              <FieldLabel>Client ID</FieldLabel>
              <Input
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                placeholder="토스증권 개발자센터 발급 Client ID"
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
                  aria-label="비밀 표시 전환"
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
              연결하기
            </Button>
            <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', lineHeight: 1.5 }}>
              키는 서버에 암호화되어 저장되며, 본인만 사용합니다. 발급은 토스증권 개발자센터에서 받을 수 있어요.
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
