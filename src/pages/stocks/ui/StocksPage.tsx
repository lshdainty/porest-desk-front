import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { MobileBackHeader } from '@/shared/ui/porest/mobile-back-header'
import { useMyFeatures } from '@/features/subscription/model/useSubscription'
import { brokerFromSlug, brokerPath, defaultBroker, useBrokerLabel } from '@/features/stock/lib/broker'
import { TossStocksPage } from './TossStocksPage'
import { NamuStocksPage } from './NamuStocksPage'

interface OutletCtx {
  mobile: boolean
}

/**
 * 증권 화면 셸 — 연결 게이트를 소유하고 본문만 갈아 끼운다.
 *
 * **증권사는 경로가 고른다**(`/desk/stocks/toss` · `/desk/stocks/namu`). 예전엔 페이지 안
 * 탭이 상태로 들고 있었는데, 그러면 사이드바가 "지금 어느 증권사를 보는 중" 을 알 수 없고
 * 링크·북마크·뒤로가기가 증권사를 기억하지 못한다. 선택을 URL 하나로 올려 두면 사이드바
 * 하위 메뉴·탭·직접 입력이 전부 같은 것을 가리킨다.
 *
 * 부모 경로 `/desk/stocks` 는 **남겨 둔다** — 모바일 전체 메뉴·기존 북마크가 여길 가리키고
 * 모바일 풀스크린 판정(`AppLayout` FULLSCREEN_PATHS)도 이 접두사를 본다. 들어오면 기본
 * 증권사로 넘긴다.
 *
 * **증권사별 화면을 억지로 합치지 않는다.** 두 증권사가 주는 데이터가 겹치지 않는다 —
 * 토스엔 랭킹·시장지표·호가가 있고 나무엔 체결추이·투자자별·채권·금현물이 있다. 한 화면에
 * 합치면 절반이 "이 증권사는 미지원" 이 되므로 본문을 증권사별로 나눠 각자 관리한다.
 *
 * 가계부 자산은 반대다 — 필요한 게 시세뿐이라 사용자가 고른 기본 소스 하나로 통합돼 있다.
 */
export function StocksPage() {
  const { mobile } = useOutletContext<OutletCtx>()
  const navigate = useNavigate()
  const { broker: brokerSlug } = useParams()
  const { data: features, isLoading } = useMyFeatures()
  const brokerLabelOf = useBrokerLabel()

  const connected = features?.connectedBrokers ?? []

  // 아직 모른다 — 여기서 리다이렉트하면 기본 증권사가 정해지기 전에 URL 이 굳는다.
  // (SecuritiesGate 가 같은 쿼리를 먼저 기다리므로 보통 여기 오면 이미 결정돼 있다.)
  if (isLoading) return null

  // 개인키 미연결 시 전 화면 연결 유도 (mock 노출 금지).
  // 증권사 API 는 시세 포함 모든 조회가 개인키 토큰을 요구하므로, 어느 증권사든 하나는 연결돼야 한다.
  if (connected.length === 0) return <ConnectGate mobile={mobile} />

  const requested = brokerFromSlug(brokerSlug)

  // 부모 경로이거나, 끊긴/모르는 증권사를 가리키는 링크 → 기본 소스 → 첫 연결 순으로 되돌린다.
  // (`defaultBroker` 는 connected 안에서만 고르므로 이 리다이렉트는 한 번에 끝난다.)
  if (!requested || !connected.includes(requested)) {
    const fallback = defaultBroker(connected, features?.primaryBroker)
    return <Navigate to={fallback ? brokerPath(fallback) : '/desk'} replace />
  }

  // **모바일엔 사이드바가 없다** — 탭을 지우면 증권사를 바꿀 길이 사라진다. 그래서 데스크톱만
  // 탭을 접고(사이드바 하위 메뉴가 그 일을 한다) 모바일은 그대로 둔다. 다만 상태가 아니라
  // 경로를 바꾼다 — 선택이 사는 곳이 한 군데여야 뒤로가기가 말이 된다.
  const header =
    mobile && connected.length > 1 ? (
      <Tabs value={requested} onValueChange={b => navigate(brokerPath(b), { replace: true })}>
        <TabsList style={{ width: '100%' }}>
          {connected.map(b => (
            <TabsTrigger key={b} value={b} style={{ flex: 1 }}>
              {brokerLabelOf(b)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    ) : undefined

  // 모르는 증권사 코드는 서버가 앞서 나갔다는 뜻이다 — 빈 화면 대신 안내를 띄운다.
  if (requested === 'NAMU') return <NamuStocksPage header={header} />
  if (requested === 'TOSS') return <TossStocksPage header={header} />
  return <UnsupportedBroker mobile={mobile} header={header} />
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
