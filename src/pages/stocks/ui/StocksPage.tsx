import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useOutletContext } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { MobileBackHeader } from '@/shared/ui/porest/mobile-back-header'
import { useMyFeatures } from '@/features/subscription/model/useSubscription'
import { TossStocksPage } from './TossStocksPage'
import { NamuStocksPage } from './NamuStocksPage'

interface OutletCtx {
  mobile: boolean
}

/**
 * 증권 화면 셸 — 연결 게이트와 증권사 선택을 소유하고 본문만 갈아 끼운다.
 *
 * **증권사별 화면을 억지로 합치지 않는다.** 두 증권사가 주는 데이터가 겹치지 않는다 —
 * 토스엔 랭킹·시장지표·호가가 있고 나무엔 체결추이·투자자별·채권·금현물이 있다. 한 화면에
 * 합치면 절반이 "이 증권사는 미지원" 이 되므로 본문을 증권사별로 나눠 각자 관리한다.
 *
 * 가계부 자산은 반대다 — 필요한 게 시세뿐이라 사용자가 고른 기본 소스 하나로 통합돼 있다.
 */
export function StocksPage() {
  const { t } = useTranslation('stocks')
  const { mobile } = useOutletContext<OutletCtx>()
  const { data: features, isLoading } = useMyFeatures()
  const [broker, setBroker] = useState<string | null>(null)

  const connected = features?.connectedBrokers ?? []

  // 개인키 미연결 시 전 화면 연결 유도 (mock 노출 금지).
  // 증권사 API 는 시세 포함 모든 조회가 개인키 토큰을 요구하므로, 어느 증권사든 하나는 연결돼야 한다.
  if (!isLoading && connected.length === 0) return <ConnectGate mobile={mobile} />

  // 저장된 선택이 끊겼으면 기본 소스 → 첫 연결 순으로 되돌린다.
  const active =
    broker && connected.includes(broker)
      ? broker
      : features?.primaryBroker && connected.includes(features.primaryBroker)
        ? features.primaryBroker
        : (connected[0] ?? '')

  // 연결이 하나뿐이면 고를 게 없다 — 탭을 감춘다.
  const header =
    connected.length > 1 ? (
      <Tabs value={active} onValueChange={setBroker}>
        <TabsList style={{ width: '100%' }}>
          {connected.map(b => (
            <TabsTrigger key={b} value={b} style={{ flex: 1 }}>
              {brokerLabel(t, b)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    ) : undefined

  // 모르는 증권사 코드는 서버가 앞서 나갔다는 뜻이다 — 빈 화면 대신 안내를 띄운다.
  if (active === 'NAMU') return <NamuStocksPage header={header} />
  if (active === 'TOSS' || active === '') return <TossStocksPage header={header} />
  return <UnsupportedBroker mobile={mobile} header={header} />
}

/** 탭 라벨. 아는 증권사는 자기 번역을, 모르면 코드를 그대로 — 서버가 먼저 늘려도 탭이 비지 않는다. */
function brokerLabel(t: (k: string) => string, broker: string): string {
  if (broker === 'TOSS') return t('broker.toss')
  if (broker === 'NAMU') return t('broker.namu')
  return broker
}

function UnsupportedBroker({ mobile, header }: { mobile: boolean; header?: React.ReactNode }) {
  const { t } = useTranslation('stocks')
  const body = (
    <>
      {header}
      <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-body-sm)' }}>
        {t('broker.unsupported')}
      </div>
    </>
  )
  return mobile ? (
    <>
      <MobileBackHeader title={t('nav.title')} />
      <div style={{ padding: '16px 24px 24px' }}>{body}</div>
    </>
  ) : (
    <div style={{ padding: 24 }}>{body}</div>
  )
}

/** 개인키 미연결: 전 화면 연결 유도. */
function ConnectGate({ mobile }: { mobile: boolean }) {
  const { t } = useTranslation('stocks')
  const gateBody = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
      <div style={{ fontSize: 'var(--text-body-md)', fontWeight: 700, color: 'var(--fg-primary)' }}>{t('connect.title')}</div>
      <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--fg-tertiary)', lineHeight: 1.5 }}>{t('connect.gateDesc')}</div>
      <Button variant="outline" size="sm" style={{ marginTop: 8 }} asChild>
        <Link to="/desk/settings">{t('connect.action')}</Link>
      </Button>
    </div>
  )
  // 모바일 카드 다이어트 — 안내도 배경 위 플랫.
  const gate = mobile ? (
    <div style={{ padding: '40px 24px' }}>{gateBody}</div>
  ) : (
    <Card style={{ padding: '40px 24px', maxWidth: 430, margin: '0 auto' }}>{gateBody}</Card>
  )
  return mobile ? (
    <>
      <MobileBackHeader title={t('nav.title')} />
      <div style={{ padding: '16px 24px 24px' }}>{gate}</div>
    </>
  ) : (
    <div style={{ padding: 24 }}>{gate}</div>
  )
}
