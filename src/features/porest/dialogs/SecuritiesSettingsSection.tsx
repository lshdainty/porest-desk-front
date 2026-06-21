import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import {
  useCancelSubscription,
  useMyFeatures,
  useMySubscription,
  useRegisterTossCredential,
  useSubscribe,
  useTossCredentialStatus,
  useDisconnectTossCredential,
} from '@/features/subscription/model/useSubscription'

/**
 * 증권 구독·토스 연결 설정. 구독해야 증권 메뉴가 열리고(결제 없는 self-grant),
 * 구독자가 본인 토스 키를 등록하면 API 로 본인 보유·시세를 가져온다.
 */
export function SecuritiesSettingsSection({ mobile }: { mobile?: boolean }) {
  const featuresQ = useMyFeatures()
  const subQ = useMySubscription()
  const credQ = useTossCredentialStatus()
  const subscribe = useSubscribe()
  const cancel = useCancelSubscription()
  const register = useRegisterTossCredential()
  const disconnect = useDisconnectTossCredential()

  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')

  const hasSecurities = featuresQ.data?.features?.includes('SECURITIES') ?? false
  const sub = subQ.data
  const isActive = sub?.status === 'ACTIVE'
  const connected = credQ.data?.connected ?? false

  const onSubscribe = () =>
    subscribe.mutate('SECURITIES', {
      onSuccess: () => toast('증권 구독이 시작되었어요'),
      onError: () => toast.error('구독에 실패했어요'),
    })
  const onCancel = () =>
    cancel.mutate(undefined, {
      onSuccess: () => toast('구독을 해지했어요'),
      onError: () => toast.error('해지에 실패했어요'),
    })
  const onConnect = () => {
    if (!clientId.trim() || !clientSecret.trim()) return
    register.mutate(
      { clientId: clientId.trim(), clientSecret: clientSecret.trim() },
      {
        onSuccess: () => {
          toast('토스증권 계정을 연결했어요')
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

  const labelStyle = { fontSize: 'var(--text-label-sm)', fontWeight: 700, color: 'var(--fg-secondary)', marginBottom: 4 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: mobile ? 0 : undefined }}>
      {/* 구독 카드 */}
      <Card style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-primary)' }}>증권 구독</div>
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
              구독하면 증권(시세·호가·보유) 메뉴가 열려요
            </div>
          </div>
          {isActive ? (
            <Badge variant="secondary">구독중</Badge>
          ) : sub ? (
            <Badge variant="outline">{sub.status === 'EXPIRED' ? '만료' : '해지'}</Badge>
          ) : null}
        </div>

        {isActive && sub ? (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-label-sm)' }}>
              <span style={{ color: 'var(--fg-tertiary)' }}>플랜</span>
              <span style={{ color: 'var(--fg-primary)', fontWeight: 600 }}>{sub.planName}</span>
            </div>
            {sub.currentPeriodEnd && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-label-sm)' }}>
                <span style={{ color: 'var(--fg-tertiary)' }}>다음 갱신</span>
                <span className="num" style={{ color: 'var(--fg-primary)', fontWeight: 600 }}>
                  {sub.currentPeriodEnd.slice(0, 10)}
                </span>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={onCancel} loading={cancel.isPending} style={{ marginTop: 6, alignSelf: 'flex-start' }}>
              구독 해지
            </Button>
          </div>
        ) : (
          <Button size="lg" onClick={onSubscribe} loading={subscribe.isPending} style={{ marginTop: 16, width: '100%' }}>
            구독하기
          </Button>
        )}
      </Card>

      {/* 토스증권 연결 카드 — 구독중일 때만 */}
      {hasSecurities && (
        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-primary)' }}>토스증권 연결</div>
              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
                본인 API 키를 등록하면 보유 주식·시세를 자동으로 가져와요
              </div>
            </div>
            {connected && <Badge variant="secondary">연결됨</Badge>}
          </div>

          {connected ? (
            <Button variant="outline" size="sm" onClick={onDisconnect} loading={disconnect.isPending} style={{ marginTop: 16, alignSelf: 'flex-start' }}>
              연결 해제
            </Button>
          ) : (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={labelStyle}>Client ID</div>
                <Input value={clientId} onChange={e => setClientId(e.target.value)} placeholder="토스증권 개발자센터 발급 Client ID" className="w-full" />
              </div>
              <div>
                <div style={labelStyle}>Client Secret</div>
                <Input type="password" value={clientSecret} onChange={e => setClientSecret(e.target.value)} placeholder="Client Secret" className="w-full" />
              </div>
              <Button size="lg" onClick={onConnect} loading={register.isPending} disabled={!clientId.trim() || !clientSecret.trim()} style={{ width: '100%' }}>
                연결하기
              </Button>
              <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', lineHeight: 1.5 }}>
                키는 서버에 암호화되어 저장되며, 본인만 사용합니다. 발급은 토스증권 개발자센터에서 받을 수 있어요.
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
