import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { ChevronDown, ChevronUp, LineChart, Search, Star } from 'lucide-react'
import { toast } from 'sonner'
import { KRW } from '@/shared/lib/porest/format'
import { MaskAmount } from '@/shared/lib/porest/hide-amounts'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import {
  FX_USDKRW,
  findStock,
  holdingCost,
  holdingEval,
  priceKRW,
  STOCK_HOLDINGS,
  STOCK_WATCH,
  STOCKS,
  type Stock,
  type StockHolding,
  type WatchGroup,
} from '../model/stocksMock'

type OutletCtx = { onAddTx: () => void; mobile: boolean }

// ---- 시세 포맷 ----------------------------------------------------------

function fmtPrice(s: Stock): string {
  if (s.market === 'US') return `$${s.price.toFixed(2)}`
  return `${KRW(s.price)}원`
}

/** 상승/하락 색 — 국내 증권 통념: 상승=빨강(error), 하락=파랑(primary). */
function trendColor(pct: number): string {
  return pct >= 0 ? 'var(--status-danger-fg)' : 'var(--fg-brand)'
}

// ---- 등락률 배지 (색 + 부호 + 아이콘 3중 병기 — A11y 1.4.1) ----------------

function PctBadge({ pct, size = 13 }: { pct: number; size?: number }) {
  const up = pct >= 0
  const Chevron = up ? ChevronUp : ChevronDown
  return (
    <span
      className="num"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        color: trendColor(pct),
        fontWeight: 700,
        fontSize: size,
      }}
    >
      <Chevron size={size + 2} strokeWidth={2.6} />
      {up ? '+' : ''}
      {pct.toFixed(2)}%
    </span>
  )
}

// ---- 종목 심볼 배지 — KR=cat-blue / US=cat-violet (다크 자동 light swap) ----

function StockBadge({ s, size = 40 }: { s: Stock; size?: number }) {
  const tone = s.market === 'KR' ? 'var(--color-cat-blue)' : 'var(--color-cat-violet)'
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 11,
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.34,
        fontWeight: 800,
        letterSpacing: '-0.02em',
        background: `color-mix(in oklab, ${tone} 16%, var(--bg-surface))`,
        color: `color-mix(in oklab, ${tone} 72%, var(--fg-primary))`,
      }}
    >
      {s.market === 'US' ? s.ticker.slice(0, 2) : s.name.slice(0, 1)}
    </span>
  )
}

// ---- 미니 스파크라인 (SVG — 클로드 디자인 Sparkline 포팅) -------------------

function Sparkline({
  values,
  height = 40,
  color,
  fill = true,
  gradientId,
}: {
  values: number[]
  height?: number
  color: string
  fill?: boolean
  gradientId?: string
}) {
  if (values.length === 0) return null
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const w = 200
  const h = height
  const step = w / (values.length - 1)
  const pts = values.map((v, i) => {
    const x = i * step
    const y = h - ((v - min) / range) * (h - 8) - 4
    return [x, y] as const
  })
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const gid = gradientId ?? 'spark-fill'
  const last = pts[pts.length - 1]!
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      {fill && (
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {fill && <path d={`${d} L${w},${h} L0,${h} Z`} fill={`url(#${gid})`} />}
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill={color} />
    </svg>
  )
}

// ---- 종목 리스트 행 ------------------------------------------------------

function StockRow({
  ticker,
  onClick,
  sub,
  right,
  active,
}: {
  ticker: string
  onClick: () => void
  sub?: string
  right?: React.ReactNode
  active?: boolean
}) {
  const s = findStock(ticker)
  if (!s) return null
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        border: 0,
        cursor: 'pointer',
        textAlign: 'left',
        background: active ? 'var(--bg-muted)' : 'transparent',
        borderRadius: 'var(--radius-md)',
        transition: 'background var(--motion-duration-fast) var(--motion-ease-out)',
        fontFamily: 'inherit',
      }}
      onMouseEnter={e => {
        if (!active) e.currentTarget.style.background = 'var(--bg-muted)'
      }}
      onMouseLeave={e => {
        if (!active) e.currentTarget.style.background = 'transparent'
      }}
    >
      <StockBadge s={s} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 'var(--text-body-sm)',
            fontWeight: 700,
            color: 'var(--fg-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {s.name}
        </div>
        <div
          style={{
            fontSize: 'var(--text-badge)',
            color: 'var(--fg-tertiary)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            marginTop: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <span style={{ fontWeight: 600 }}>{s.ticker}</span>
          <span>·</span>
          <span style={{ whiteSpace: 'nowrap' }}>{sub || s.sector}</span>
        </div>
      </div>
      <div style={{ width: 56, height: 28, flexShrink: 0, opacity: 0.9 }}>
        <Sparkline values={s.spark} height={28} color={trendColor(s.changePct)} fill={false} />
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 78 }}>
        {right || (
          <>
            <div className="num" style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-primary)' }}>
              {fmtPrice(s)}
            </div>
            <div style={{ marginTop: 1 }}>
              <PctBadge pct={s.changePct} size={11.5} />
            </div>
          </>
        )}
      </div>
    </button>
  )
}

// ---- 호가창 (order book — 연동 전 시드 고정 의사난수 잔량) -------------------

function OrderBook({ s }: { s: Stock }) {
  const base = s.price
  const tick = s.market === 'US' ? 0.5 : base >= 100000 ? 500 : base >= 10000 ? 100 : 50
  const fmt = (p: number) => (s.market === 'US' ? `$${p.toFixed(2)}` : KRW(Math.round(p)))
  const rng = (i: number) => ((i * 9301 + 49297) % 233280) / 233280
  const asks = [4, 3, 2, 1, 0].map(i => ({ p: base + tick * (i + 1), q: Math.round(40 + rng(i + 1) * 960) }))
  const bids = [0, 1, 2, 3, 4].map(i => ({ p: base - tick * (i + 1), q: Math.round(40 + rng(i + 7) * 960) }))
  const maxQ = Math.max(...asks.map(a => a.q), ...bids.map(b => b.q))

  const Row = ({ p, q, type }: { p: number; q: number; type: 'ask' | 'bid' }) => {
    const isAsk = type === 'ask'
    const col = isAsk ? 'var(--fg-brand)' : 'var(--status-danger-fg)'
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', height: 26, gap: 8 }}>
        {isAsk ? (
          <span />
        ) : (
          <div style={{ position: 'relative', height: 22, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: `${(q / maxQ) * 100}%`,
                background: 'color-mix(in oklab, var(--status-danger-fg) 13%, var(--bg-surface))',
                borderRadius: 4,
              }}
            />
            <span className="num" style={{ position: 'relative', fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', paddingRight: 6 }}>
              {q.toLocaleString()}
            </span>
          </div>
        )}
        <div style={{ textAlign: 'center', position: 'relative', height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="num" style={{ fontSize: 12.5, fontWeight: 700, color: col }}>
            {fmt(p)}
          </span>
        </div>
        {isAsk ? (
          <div style={{ position: 'relative', height: 22, display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${(q / maxQ) * 100}%`,
                background: 'color-mix(in oklab, var(--fg-brand) 14%, var(--bg-surface))',
                borderRadius: 4,
              }}
            />
            <span className="num" style={{ position: 'relative', fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', paddingLeft: 6 }}>
              {q.toLocaleString()}
            </span>
          </div>
        ) : (
          <span />
        )}
      </div>
    )
  }

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          fontSize: 10.5,
          color: 'var(--fg-tertiary)',
          fontWeight: 600,
          marginBottom: 4,
          padding: '0 2px',
        }}
      >
        <span style={{ textAlign: 'right', paddingRight: 6 }}>매수 잔량</span>
        <span style={{ textAlign: 'left', paddingLeft: 6, gridColumn: 2 }}>매도 잔량</span>
      </div>
      {asks.map((a, i) => (
        <Row key={`a${i}`} {...a} type="ask" />
      ))}
      <div
        style={{
          borderTop: '1px dashed var(--border-subtle)',
          borderBottom: '1px dashed var(--border-subtle)',
          margin: '3px 0',
          padding: '5px 0',
          textAlign: 'center',
        }}
      >
        <span className="num" style={{ fontSize: 'var(--text-label-sm)', fontWeight: 800, color: trendColor(s.changePct) }}>
          {fmtPrice(s)}
        </span>
        <span style={{ marginLeft: 6 }}>
          <PctBadge pct={s.changePct} size={11} />
        </span>
      </div>
      {bids.map((b, i) => (
        <Row key={`b${i}`} {...b} type="bid" />
      ))}
    </div>
  )
}

// ---- 종목 상세 본문 ------------------------------------------------------

const RANGES = ['1D', '1주', '1개월', '3개월', '1년'] as const

function StockDetailBody({
  ticker,
  holding,
  watched,
  onToggleWatch,
  mobile,
}: {
  ticker: string
  holding: StockHolding | null
  watched: boolean
  onToggleWatch: () => void
  mobile: boolean
}) {
  const [range, setRange] = useState<(typeof RANGES)[number]>('1D')
  const s = findStock(ticker)
  if (!s) return null

  const info: Array<[string, string]> = [
    ['시가총액', s.marketCap],
    ['PER', s.per != null ? s.per.toFixed(1) : '—'],
    ['EPS', s.eps != null ? (s.market === 'US' ? `$${s.eps.toFixed(2)}` : KRW(s.eps)) : '—'],
    ['52주 최고', s.market === 'US' ? `$${s.high52.toFixed(2)}` : KRW(s.high52)],
    ['52주 최저', s.market === 'US' ? `$${s.low52.toFixed(2)}` : KRW(s.low52)],
    ['거래량', s.vol],
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 헤더: 종목명·관심 토글 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <StockBadge s={s} size={46} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--fg-primary)', letterSpacing: '-0.01em' }}>{s.name}</div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 1 }}>
            {s.ticker} · {s.market === 'US' ? '미국' : 'KRX'} · {s.sector}
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleWatch}
          title={watched ? '관심 해제' : '관심 등록'}
          aria-pressed={watched}
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            flexShrink: 0,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: watched ? 'color-mix(in oklab, var(--color-cat-yellow) 18%, var(--bg-surface))' : 'var(--bg-sunken)',
            border: '1px solid var(--border-subtle)',
            color: watched ? 'color-mix(in oklab, var(--color-cat-yellow) 62%, var(--fg-primary))' : 'var(--fg-tertiary)',
          }}
        >
          <Star size={18} strokeWidth={2} style={{ fill: watched ? 'currentColor' : 'none' }} />
        </button>
      </div>

      {/* 현재가 */}
      <div>
        <div className="num" style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-primary)' }}>
          {fmtPrice(s)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <PctBadge pct={s.changePct} size={14} />
          {s.market === 'US' && (
            <span className="num" style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>
              ≈ {KRW(priceKRW(s))}원
            </span>
          )}
        </div>
      </div>

      {/* 차트 + 기간 세그먼트 */}
      <Card style={{ padding: '14px 12px 10px' }}>
        <div style={{ height: mobile ? 150 : 180 }}>
          <Sparkline values={s.spark} height={mobile ? 150 : 180} color={trendColor(s.changePct)} fill gradientId={`spark-detail-${s.ticker}`} />
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 8, justifyContent: 'center' }}>
          {RANGES.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              style={{
                flex: 1,
                maxWidth: 64,
                padding: '6px 0',
                fontSize: 'var(--text-caption)',
                fontWeight: 600,
                cursor: 'pointer',
                borderRadius: 'var(--radius-sm)',
                border: 0,
                background: range === r ? 'var(--bg-brand)' : 'transparent',
                color: range === r ? 'var(--fg-on-brand)' : 'var(--fg-tertiary)',
                fontFamily: 'inherit',
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </Card>

      {/* 내 보유 (보유 종목일 때) */}
      {holding &&
        (() => {
          const ev = holdingEval(holding)
          const cost = holdingCost(holding)
          const pnl = ev - cost
          const pnlPct = (pnl / cost) * 100
          const rows: Array<[string, React.ReactNode, string]> = [
            ['평가금액', <MaskAmount key="ev">{`${KRW(ev)}원`}</MaskAmount>, 'var(--fg-primary)'],
            ['평가손익', <MaskAmount key="pnl">{`${pnl >= 0 ? '+' : '−'}${KRW(pnl, { abs: true })}원`}</MaskAmount>, trendColor(pnl)],
            ['보유수량', `${holding.qty}주`, 'var(--fg-primary)'],
            ['수익률', `${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%`, trendColor(pnl)],
            ['평균단가', s.market === 'US' ? `$${holding.avg.toFixed(2)}` : `${KRW(holding.avg)}원`, 'var(--fg-secondary)'],
            ['매입금액', <MaskAmount key="cost">{`${KRW(cost)}원`}</MaskAmount>, 'var(--fg-secondary)'],
          ]
          return (
            <Card style={{ padding: 16 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-secondary)', marginBottom: 12 }}>내 보유</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 10px' }}>
                {rows.map(([k, v, c]) => (
                  <div key={k}>
                    <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', marginBottom: 2 }}>{k}</div>
                    <div className="num" style={{ fontSize: 'var(--text-body-sm)', fontWeight: 700, color: c }}>
                      {v}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )
        })()}

      {/* 호가 + 기본정보 */}
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-secondary)', marginBottom: 12 }}>호가</div>
          <OrderBook s={s} />
        </Card>
        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-secondary)', marginBottom: 12 }}>기본 정보</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {info.map(([k, v], i) => (
              <div
                key={k}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '9px 0',
                  borderTop: i === 0 ? 0 : '1px solid var(--border-subtle)',
                }}
              >
                <span style={{ fontSize: 12.5, color: 'var(--fg-tertiary)' }}>{k}</span>
                <span className="num" style={{ fontSize: 'var(--text-label-sm)', fontWeight: 600, color: 'var(--fg-primary)' }}>
                  {v}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 매매 (모의) — 매도=primary(파랑), 매수=destructive(빨강) — 국내 통념 */}
      <div style={{ display: 'flex', gap: 10 }}>
        <Button
          variant="default"
          size="lg"
          style={{ flex: 1 }}
          onClick={() => toast(`${s.name} 매도 주문 — Open API 연동 시 동작`)}
        >
          매도
        </Button>
        <Button
          variant="destructive"
          size="lg"
          style={{ flex: 1 }}
          onClick={() => toast(`${s.name} 매수 주문 — Open API 연동 시 동작`)}
        >
          매수
        </Button>
      </div>

      <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', textAlign: 'center', lineHeight: 1.5 }}>
        토스증권 Open API 연동 시 실시간 호가·체결가가 반영됩니다.
        <br />
        시세는 투자 참고용이며 실제 주문은 약관 동의 후 가능합니다.
      </div>
    </div>
  )
}

// ---- 종목 검색 다이얼로그 -------------------------------------------------

function StockSearchDialog({
  mobile,
  onPick,
  onClose,
}: {
  mobile: boolean
  onPick: (ticker: string) => void
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const ql = q.trim().toLowerCase()
  const results = ql
    ? STOCKS.filter(
        s => s.name.toLowerCase().includes(ql) || s.ticker.toLowerCase().includes(ql) || s.sector.includes(q.trim()),
      )
    : STOCKS
  return (
    <ModalShell title="종목 검색" onClose={onClose} mobile={mobile} mobileMinHeight="85dvh">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Input
          autoFocus
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="종목명 · 티커로 검색 (예: 삼성전자, NVDA)"
        />
        <div style={{ maxHeight: mobile ? undefined : '56vh', overflowY: 'auto' }}>
          {results.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-label-sm)' }}>
              '{q}' 검색 결과가 없어요
            </div>
          ) : (
            results.map(s => (
              <StockRow
                key={s.ticker}
                ticker={s.ticker}
                onClick={() => {
                  onPick(s.ticker)
                  onClose()
                }}
              />
            ))
          )}
        </div>
      </div>
    </ModalShell>
  )
}

// ---- 메인 화면 -----------------------------------------------------------

export function StocksPage() {
  const { mobile } = useOutletContext<OutletCtx>()
  const [selected, setSelected] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [seg, setSeg] = useState<'holdings' | 'watch'>('holdings')
  const [watchGroups, setWatchGroups] = useState<WatchGroup[]>(STOCK_WATCH)
  const [activeGroup, setActiveGroup] = useState(STOCK_WATCH[0]!.id)

  // 데스크톱: 기본 선택 = 첫 보유 종목
  useEffect(() => {
    if (!mobile && !selected) setSelected(STOCK_HOLDINGS[0]!.ticker)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobile])

  const watchedTickers = useMemo(() => new Set(watchGroups.flatMap(g => g.tickers)), [watchGroups])
  const isWatched = (t: string) => watchedTickers.has(t)
  const toggleWatch = (t: string) => {
    setWatchGroups(prev => {
      const inSome = prev.some(g => g.tickers.includes(t))
      if (inSome) return prev.map(g => ({ ...g, tickers: g.tickers.filter(x => x !== t) }))
      return prev.map(g => (g.id === activeGroup ? { ...g, tickers: [...g.tickers, t] } : g))
    })
  }

  // 요약
  const totalEval = STOCK_HOLDINGS.reduce((sum, h) => sum + holdingEval(h), 0)
  const totalCost = STOCK_HOLDINGS.reduce((sum, h) => sum + holdingCost(h), 0)
  const totalPnl = totalEval - totalCost
  const totalPnlPct = (totalPnl / totalCost) * 100
  const holdingsSorted = [...STOCK_HOLDINGS].sort((a, b) => holdingEval(b) - holdingEval(a))
  const curGroup = watchGroups.find(g => g.id === activeGroup) ?? watchGroups[0]!
  const selHolding = selected ? (STOCK_HOLDINGS.find(h => h.ticker === selected) ?? null) : null

  const summary = (
    <Card style={{ padding: mobile ? 18 : 22 }}>
      <div style={{ fontSize: 12.5, color: 'var(--fg-tertiary)', fontWeight: 600 }}>내 투자 평가금액</div>
      <div
        className="num"
        style={{ fontSize: mobile ? 28 : 32, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-primary)', marginTop: 4 }}
      >
        <MaskAmount>{KRW(totalEval)}</MaskAmount>원
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
        <span className="num" style={{ fontSize: 13.5, fontWeight: 700, color: trendColor(totalPnl), whiteSpace: 'nowrap' }}>
          <MaskAmount>{`${totalPnl >= 0 ? '+' : '−'}${KRW(totalPnl, { abs: true })}원`}</MaskAmount>
        </span>
        <PctBadge pct={totalPnlPct} size={13} />
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
        {(
          [
            ['매입금액', <MaskAmount key="c">{`${KRW(totalCost)}원`}</MaskAmount>],
            ['보유 종목', `${STOCK_HOLDINGS.length}개`],
            ['환율(USD)', `₩${FX_USDKRW.toLocaleString()}`],
          ] as Array<[string, React.ReactNode]>
        ).map(([k, v]) => (
          <div key={k} style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', marginBottom: 2 }}>{k}</div>
            <div className="num" style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-primary)' }}>
              {v}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )

  const listPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          background: 'var(--bg-muted)',
          border: '1px solid transparent',
          color: 'var(--fg-tertiary)',
          fontSize: 'var(--text-body-sm)',
          fontFamily: 'inherit',
        }}
      >
        <Search size={17} /> 종목 검색
      </button>

      <Tabs value={seg} onValueChange={v => setSeg(v as 'holdings' | 'watch')}>
        <TabsList variant="pill">
          <TabsTrigger variant="pill" value="holdings">
            보유 {STOCK_HOLDINGS.length}
          </TabsTrigger>
          <TabsTrigger variant="pill" value="watch">
            관심 {watchedTickers.size}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {seg === 'holdings' ? (
        <Card style={{ padding: 6 }}>
          {holdingsSorted.map(h => {
            const ev = holdingEval(h)
            const pnl = ev - holdingCost(h)
            const pct = (pnl / holdingCost(h)) * 100
            return (
              <StockRow
                key={h.ticker}
                ticker={h.ticker}
                active={selected === h.ticker}
                onClick={() => setSelected(h.ticker)}
                sub={`${h.qty}주 보유`}
                right={
                  <>
                    <div className="num" style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-primary)' }}>
                      <MaskAmount>{`${KRW(ev)}원`}</MaskAmount>
                    </div>
                    <div className="num" style={{ fontSize: 'var(--text-badge)', fontWeight: 700, color: trendColor(pnl), marginTop: 1 }}>
                      {pnl >= 0 ? '+' : ''}
                      {pct.toFixed(2)}%
                    </div>
                  </>
                }
              />
            )
          })}
        </Card>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {watchGroups.map(g => (
              <button
                key={g.id}
                type="button"
                className={`chip ${g.id === activeGroup ? 'active' : ''}`}
                onClick={() => setActiveGroup(g.id)}
              >
                {g.name} <span style={{ opacity: 0.7 }}>{g.tickers.length}</span>
              </button>
            ))}
          </div>
          <Card style={{ padding: 6 }}>
            {curGroup.tickers.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-label-sm)' }}>
                관심 종목이 없어요. 검색해서 별표를 눌러보세요.
              </div>
            ) : (
              curGroup.tickers.map(t => (
                <StockRow key={t} ticker={t} active={selected === t} onClick={() => setSelected(t)} />
              ))
            )}
          </Card>
        </>
      )}
    </div>
  )

  // ---- 모바일: 스택 + 상세 시트 ----
  if (mobile) {
    return (
      <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {summary}
        {listPanel}
        {selected && (
          <ModalShell title="종목 상세" onClose={() => setSelected(null)} mobile mobileMinHeight="88dvh">
            <StockDetailBody
              ticker={selected}
              holding={selHolding}
              watched={isWatched(selected)}
              onToggleWatch={() => toggleWatch(selected)}
              mobile
            />
          </ModalShell>
        )}
        {searchOpen && <StockSearchDialog mobile onPick={t => setSelected(t)} onClose={() => setSearchOpen(false)} />}
      </div>
    )
  }

  // ---- 데스크톱/태블릿: 2-pane ----
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 420px) 1fr', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {summary}
          {listPanel}
        </div>
        <Card style={{ padding: 24 }}>
          {selected ? (
            <StockDetailBody
              ticker={selected}
              holding={selHolding}
              watched={isWatched(selected)}
              onToggleWatch={() => toggleWatch(selected)}
              mobile={false}
            />
          ) : (
            <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--fg-tertiary)' }}>
              <LineChart size={40} />
              <div style={{ marginTop: 12, fontSize: 'var(--text-body-sm)' }}>왼쪽에서 종목을 선택하세요</div>
            </div>
          )}
        </Card>
      </div>
      {searchOpen && <StockSearchDialog mobile={false} onPick={t => setSelected(t)} onClose={() => setSearchOpen(false)} />}
    </div>
  )
}
