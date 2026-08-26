/**
 * 포트폴리오 구성 도넛 + 보유 미연결 빈 상태 — 증권사와 무관하다.
 *
 * 토스 페이지 안에 있던 것을 끌어내며 입력만 일반화했다. 예전엔 `TossHoldingsItem[]` 을 직접
 * 받아 `marketValue.amount` 를 읽었는데, 그러면 나무는 같은 그림을 그리려고 사본을 떠야 한다.
 * 도넛에 필요한 건 이름과 크기뿐이라 그 둘만 받는다.
 */
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { MaskAmount } from '@/shared/lib/porest/hide-amounts'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Donut } from '@/shared/ui/porest/charts'

const DONUT_PALETTE = [
  'var(--color-cat-blue)',
  'var(--color-cat-green)',
  'var(--color-cat-violet)',
  'var(--color-cat-orange)',
  'var(--color-cat-pink)',
  'var(--color-cat-indigo)',
  'var(--color-cat-brown)',
]

/** 도넛 한 조각 — 이름과 크기만. 통화·증권사는 도넛이 알 필요가 없다(비중은 비율이다). */
export interface DonutSlice {
  name: string
  value: number
}

export function PortfolioDonut({ slices }: { slices: DonutSlice[] }) {
  const { t } = useTranslation('stocks')
  const rows = slices
    .map((s, i) => ({ name: s.name, value: s.value, color: DONUT_PALETTE[i % DONUT_PALETTE.length]! }))
    .sort((a, b) => b.value - a.value)
  const total = rows.reduce((sum, r) => sum + r.value, 0) || 1
  return (
    <Card style={{ padding: 22 }}>
      <div style={{ fontSize: 'var(--text-label-sm)', fontWeight: 700, color: 'var(--fg-secondary)', marginBottom: 16 }}>{t('portfolio.title')}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <Donut size={132} stroke={20} segments={rows.map(r => ({ value: r.value, color: r.color }))}>
          <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)' }}>{t('portfolio.stocksLabel')}</div>
          <div className="num" style={{ fontSize: 15, fontWeight: 800, color: 'var(--fg-primary)' }}>{t('unit.count', { count: rows.length })}</div>
        </Donut>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0 }}>
          {rows.map(r => (
            <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 9, height: 9, borderRadius: 'var(--radius-xs)', background: r.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
              <span className="num" style={{ marginLeft: 'auto', fontSize: 'var(--text-caption)', fontWeight: 700, color: 'var(--fg-secondary)' }}>
                <MaskAmount card="stocks.summary">{`${((r.value / total) * 100).toFixed(1)}%`}</MaskAmount>
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

/** 보유를 못 읽을 때 — 연결을 유도한다. 모바일은 카드 다이어트로 배경 위 플랫. */
export function HoldingsEmpty({ mobile = false, desc }: { mobile?: boolean; desc?: string }) {
  const { t } = useTranslation('stocks')
  const body = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
      <div style={{ fontSize: 'var(--text-body-md)', fontWeight: 700, color: 'var(--fg-primary)' }}>{t('connect.title')}</div>
      <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--fg-tertiary)' }}>{desc ?? t('connect.holdingsDesc')}</div>
      <Button variant="outline" size="sm" style={{ marginTop: 8 }} asChild>
        <Link to="/desk/settings">{t('connect.action')}</Link>
      </Button>
    </div>
  )
  if (mobile) return <div style={{ padding: '32px 20px' }}>{body}</div>
  return <Card style={{ padding: '32px 20px' }}>{body}</Card>
}
