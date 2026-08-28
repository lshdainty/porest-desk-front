/**
 * 포트폴리오 개요 — 종목을 안 골랐을 때 우측 단을 채운다.
 *
 * 예전엔 그 자리가 "왼쪽에서 종목을 선택하세요" 한 줄이었다. 데스크톱은 첫 보유 종목을
 * 자동 선택하므로 그 안내는 **보유가 0이거나 조회가 실패했을 때만** 나왔는데, 하필 그때
 * 화면 절반이 빈 채로 남았다 — 가장 도움이 필요한 순간에 가장 빈 화면을 보여준 셈이다.
 *
 * 이제 목록 맨 위 '전체 포트폴리오' 행이 이 화면을 부른다. 좁은 좌측 단에 눌려 있던
 * 구성 도넛이 여기로 올라와 제 크기를 얻고, 옆에 비중 표가 선다.
 *
 * **증권사와 무관하다** — 조각과 행만 받는다. 토스는 아래에 랭킹을 덧붙이고 나무는 안 붙이는데,
 * 그건 `extra` 로 넘긴다(나무엔 랭킹 API 가 없다).
 */
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { MaskAmount } from '@/shared/lib/porest/hide-amounts'
import { Card } from '@/shared/ui/card'
import { PortfolioDonut, type DonutSlice } from './portfolio-donut'
import { PanelEmpty } from './stock-row'

/** 비중 표 한 줄. 금액은 이미 포맷된 문자열로 받는다 — 통화 표기는 증권사가 안다. */
export interface OverviewRow {
  symbol: string
  name: string
  /** 그 통화 기준 평가금액 표기(예: `1,020만원` · `$7,412.10`). */
  amountText: string
  /** 원화 환산 비중(%). 척도가 하나로 안 잡히면 null — 칸을 비운다. */
  weightPct: number | null
  profitPct: number
}

export function PortfolioOverview({
  title,
  slices,
  rows,
  totalText,
  subText,
  notice,
  extra,
  mobile,
}: {
  title: string
  /** 도넛 조각. 빈 배열이면 도넛을 안 그린다(통화가 섞였는데 환율이 없는 경우). */
  slices: DonutSlice[]
  rows: OverviewRow[]
  totalText: ReactNode
  subText?: ReactNode
  /** 도넛을 못 그리는 이유 등. 있으면 도넛 자리에 대신 선다. */
  notice?: string
  extra?: ReactNode
  mobile: boolean
}) {
  const { t } = useTranslation('stocks')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 'var(--text-badge)', fontWeight: 600, color: 'var(--fg-tertiary)' }}>{title}</div>
        <div
          className="num"
          style={{ fontSize: mobile ? 26 : 30, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-primary)', marginTop: 3 }}
        >
          <MaskAmount card="stocks.holdings">{totalText}</MaskAmount>
        </div>
        {subText && (
          <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--fg-tertiary)', marginTop: 4 }}>{subText}</div>
        )}
      </div>

      {slices.length > 0 ? (
        <PortfolioDonut slices={slices} />
      ) : notice ? (
        <Card style={{ padding: 16 }}>
          <PanelEmpty msg={notice} />
        </Card>
      ) : null}

      {rows.length > 0 && (
        <Card style={{ padding: mobile ? 14 : 18 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-secondary)', marginBottom: 10 }}>
            {t('portfolio.breakdownTitle')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto auto auto', gap: '0 14px' }}>
            {[t('portfolio.colName'), t('portfolio.colAmount'), t('portfolio.colWeight'), t('portfolio.colReturn')].map(
              (h, i) => (
                <div
                  key={h}
                  style={{
                    fontSize: 'var(--text-badge)',
                    color: 'var(--fg-tertiary)',
                    fontWeight: 600,
                    padding: '0 0 8px',
                    textAlign: i === 0 ? 'left' : 'right',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </div>
              ),
            )}
            {rows.map(r => (
              <div key={r.symbol} style={{ display: 'contents' }}>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: 'var(--fg-primary)',
                    padding: '8px 0',
                    borderTop: '1px solid var(--border-subtle)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {r.name}
                </div>
                <div
                  className="num"
                  style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-primary)', padding: '8px 0', borderTop: '1px solid var(--border-subtle)', textAlign: 'right', whiteSpace: 'nowrap' }}
                >
                  <MaskAmount card="stocks.holdings">{r.amountText}</MaskAmount>
                </div>
                <div
                  className="num"
                  style={{ fontSize: 12.5, color: 'var(--fg-secondary)', padding: '8px 0', borderTop: '1px solid var(--border-subtle)', textAlign: 'right', whiteSpace: 'nowrap' }}
                >
                  {r.weightPct != null ? `${r.weightPct.toFixed(1)}%` : '—'}
                </div>
                <div
                  className="num"
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: r.profitPct >= 0 ? 'var(--status-danger-fg)' : 'var(--fg-brand)',
                    padding: '8px 0',
                    borderTop: '1px solid var(--border-subtle)',
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {r.profitPct >= 0 ? '+' : ''}
                  {r.profitPct.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {extra}
    </div>
  )
}
