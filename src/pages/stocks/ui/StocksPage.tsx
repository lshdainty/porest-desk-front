import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { ChevronDown, ChevronUp, Info, LineChart, Search, Star } from 'lucide-react'
import { toast } from 'sonner'
import { tileRadius } from '@/shared/lib'
import { KRW } from '@/shared/lib/porest/format'
import { MaskAmount } from '@/shared/lib/porest/hide-amounts'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Donut } from '@/shared/ui/porest/charts'
import { Input } from '@/shared/ui/input'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { MobileBackHeader } from '@/shared/ui/porest/mobile-back-header'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import type { TossOrderbook, TossTrade } from '@/features/stock/api/stockApi'
import { useStockLiveOverlay, useTossOrderbook, useTossTrades } from '@/features/stock/model/useTossStocks'
import {
  dailyQuotes,
  FX_USDKRW,
  findStock,
  holdingCost,
  holdingEval,
  MARKET_INDICES,
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

/** 라이브 체결 테이프 변환 (토스 trades). 없으면 null → 호출부 폴백. dir=직전 체결가 대비 방향. */
function liveTradeFills(trades?: TossTrade[]): { time: string; p: number; q: number; dir: number }[] | null {
  if (!trades || trades.length === 0) return null
  return trades.slice(0, 12).map((t, i, arr) => {
    const p = Number.parseFloat(t.price)
    const prev = i + 1 < arr.length ? Number.parseFloat(arr[i + 1]!.price) : p
    const time = /(\d{2}:\d{2}:\d{2})/.exec(t.timestamp)?.[1] ?? t.timestamp
    return { time, p, q: Math.round(Number.parseFloat(t.volume)), dir: p >= prev ? 1 : -1 }
  })
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
        borderRadius: tileRadius(size),
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

function OrderBook({ s, live }: { s: Stock; live?: TossOrderbook | null }) {
  const base = s.price
  const tick = s.market === 'US' ? 0.5 : base >= 100000 ? 500 : base >= 10000 ? 100 : 50
  const fmt = (p: number) => (s.market === 'US' ? `$${p.toFixed(2)}` : KRW(Math.round(p)))
  const rng = (i: number) => ((i * 9301 + 49297) % 233280) / 233280
  // 라이브 호가(토스): asks=낮은가격순 → 상단 표시 위해 5개 잘라 역순(높은가격 위), bids=높은가격순 그대로.
  const hasLive = !!live && live.asks.length > 0 && live.bids.length > 0
  const asks = hasLive
    ? live!.asks.slice(0, 5).map(e => ({ p: Number.parseFloat(e.price), q: Math.round(Number.parseFloat(e.volume)) })).reverse()
    : [4, 3, 2, 1, 0].map(i => ({ p: base + tick * (i + 1), q: Math.round(40 + rng(i + 1) * 960) }))
  const bids = hasLive
    ? live!.bids.slice(0, 5).map(e => ({ p: Number.parseFloat(e.price), q: Math.round(Number.parseFloat(e.volume)) }))
    : [0, 1, 2, 3, 4].map(i => ({ p: base - tick * (i + 1), q: Math.round(40 + rng(i + 7) * 960) }))
  const maxQ = Math.max(1, ...asks.map(a => a.q), ...bids.map(b => b.q))

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

// ---- 장 상태 바 (Market Info: 장 운영 상태) --------------------------------

function MarketStatusBar() {
  const markets = [
    { name: '국내 (KRX·NXT)', open: true, detail: '장중 · 15:42' },
    { name: '미국 (NASDAQ)', open: false, detail: '장마감 · 익일 22:30 개장' },
  ]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      {markets.map(m => (
        <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 'var(--radius-full)',
              flexShrink: 0,
              background: m.open ? 'var(--status-success-fg)' : 'var(--fg-tertiary)',
            }}
          />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-primary)' }}>{m.name}</span>
          <span style={{ fontSize: 'var(--text-caption)', color: m.open ? 'var(--fg-secondary)' : 'var(--fg-tertiary)' }}>
            {m.detail}
          </span>
        </div>
      ))}
      <span style={{ marginLeft: 'auto', fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)' }}>
        토스증권 Open API · 시세 지연 표시
      </span>
    </div>
  )
}

// ---- 시장 지수 스트립 (모바일 가로 스크롤 / 데스크톱 grid) --------------------

function IndexStrip({ mobile }: { mobile: boolean }) {
  if (mobile) {
    return (
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
        {MARKET_INDICES.map(ix => (
          <Card key={ix.id} style={{ padding: '11px 14px', flexShrink: 0, minWidth: 124 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 'var(--text-badge)', fontWeight: 600, color: 'var(--fg-secondary)' }}>{ix.name}</span>
              <span className="num" style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-primary)' }}>
                {ix.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <PctBadge pct={ix.changePct} size={11} />
            </div>
          </Card>
        ))}
      </div>
    )
  }
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${MARKET_INDICES.length}, 1fr)` }}>
        {MARKET_INDICES.map((ix, i) => (
          <div
            key={ix.id}
            style={{
              padding: '14px 18px',
              borderLeft: i === 0 ? 'none' : '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--fg-secondary)' }}>{ix.name}</span>
              <span style={{ width: 44, height: 18, opacity: 0.9 }}>
                <Sparkline values={ix.spark} height={18} color={trendColor(ix.changePct)} fill={false} />
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <span className="num" style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-primary)' }}>
                {ix.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <PctBadge pct={ix.changePct} size={11.5} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ---- 포트폴리오 구성 도넛 (데스크톱) ----------------------------------------

const DONUT_PALETTE = [
  'var(--color-cat-blue)',
  'var(--color-cat-green)',
  'var(--color-cat-violet)',
  'var(--color-cat-orange)',
  'var(--color-cat-pink)',
  'var(--color-cat-indigo)',
  'var(--color-cat-brown)',
]

function PortfolioDonut({ holdings }: { holdings: StockHolding[] }) {
  const rows = holdings
    .map((h, i) => ({ name: findStock(h.ticker)?.name ?? h.ticker, value: holdingEval(h), color: DONUT_PALETTE[i % DONUT_PALETTE.length]! }))
    .sort((a, b) => b.value - a.value)
  const total = rows.reduce((sum, r) => sum + r.value, 0) || 1
  return (
    <Card style={{ padding: 22 }}>
      <div style={{ fontSize: 'var(--text-label-sm)', fontWeight: 700, color: 'var(--fg-secondary)', marginBottom: 16 }}>포트폴리오 구성</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <Donut size={132} stroke={20} segments={rows.map(r => ({ value: r.value, color: r.color }))}>
          <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)' }}>종목</div>
          <div className="num" style={{ fontSize: 15, fontWeight: 800, color: 'var(--fg-primary)' }}>{rows.length}개</div>
        </Donut>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0 }}>
          {rows.map(r => (
            <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 9, height: 9, borderRadius: 'var(--radius-xs)', background: r.color, flexShrink: 0 }} />
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: 'var(--fg-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {r.name}
              </span>
              <span className="num" style={{ marginLeft: 'auto', fontSize: 'var(--text-caption)', fontWeight: 700, color: 'var(--fg-secondary)' }}>
                <MaskAmount>{`${((r.value / total) * 100).toFixed(1)}%`}</MaskAmount>
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

// ---- 발견(디스커버리) 랭킹 — 급상승/급하락/거래량 ----------------------------

function volNum(vol: string): number {
  const raw = vol.replace(/,/g, '')
  if (raw.endsWith('M')) return parseFloat(raw) * 1_000_000
  if (raw.endsWith('K')) return parseFloat(raw) * 1_000
  return parseFloat(raw)
}

function DiscoverPanel({ onPick, selected }: { onPick: (t: string) => void; selected: string | null }) {
  const [tab, setTab] = useState<'gainers' | 'losers' | 'volume'>('gainers')
  const list = useMemo(() => {
    const arr = [...STOCKS]
    if (tab === 'gainers') arr.sort((a, b) => b.changePct - a.changePct)
    else if (tab === 'losers') arr.sort((a, b) => a.changePct - b.changePct)
    else arr.sort((a, b) => volNum(b.vol) - volNum(a.vol))
    return arr.slice(0, 6)
  }, [tab])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Tabs value={tab} onValueChange={v => setTab(v as 'gainers' | 'losers' | 'volume')}>
        <TabsList variant="pill" size="sm">
          <TabsTrigger variant="pill" value="gainers">
            급상승
          </TabsTrigger>
          <TabsTrigger variant="pill" value="losers">
            급하락
          </TabsTrigger>
          <TabsTrigger variant="pill" value="volume">
            거래량
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Card style={{ padding: 6 }}>
        {list.map((s, i) => (
          <div key={s.ticker} style={{ display: 'flex', alignItems: 'center' }}>
            <span
              className="num"
              style={{
                width: 22,
                textAlign: 'center',
                flexShrink: 0,
                fontSize: 'var(--text-label-sm)',
                fontWeight: 700,
                color: i < 3 ? 'var(--fg-brand)' : 'var(--fg-tertiary)',
              }}
            >
              {i + 1}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <StockRow ticker={s.ticker} active={selected === s.ticker} onClick={() => onPick(s.ticker)} />
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}

// ---- 호가 / 체결 탭 카드 ---------------------------------------------------

function QuotesCard({ s }: { s: Stock }) {
  const [tab, setTab] = useState<'book' | 'tape'>('book')
  // 라이브 호가·체결 (토스 Open API). 키/데이터 없으면 의사난수 폴백.
  const orderbookQ = useTossOrderbook(s.ticker)
  const tradesQ = useTossTrades(s.ticker)
  const fmt = (p: number) => (s.market === 'US' ? `$${p.toFixed(2)}` : KRW(Math.round(p)))
  const tick = s.market === 'US' ? 0.5 : s.price >= 100000 ? 500 : s.price >= 10000 ? 100 : 50
  const rng = (i: number) => ((i * 2654435761) % 100000) / 100000
  const liveFills = liveTradeFills(tradesQ.data)
  const fills =
    liveFills ??
    Array.from({ length: 12 }, (_, i) => {
      const dir = rng(i + 3) > 0.45 ? 1 : -1
      const p = s.price + dir * tick * Math.round(rng(i + 9) * 2)
      const q = Math.round(1 + rng(i + 5) * 80)
      const mm = 42 - i
      return { time: `15:${String(mm).padStart(2, '0')}:${String(Math.round(rng(i + 7) * 59)).padStart(2, '0')}`, p, q, dir }
    })
  return (
    <Card style={{ padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <Tabs value={tab} onValueChange={v => setTab(v as 'book' | 'tape')}>
          <TabsList variant="pill" size="sm">
            <TabsTrigger variant="pill" value="book">
              호가
            </TabsTrigger>
            <TabsTrigger variant="pill" value="tape">
              체결
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {tab === 'book' ? (
        <OrderBook s={s} live={orderbookQ.data} />
      ) : (
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1.2fr 1fr',
              fontSize: 10.5,
              color: 'var(--fg-tertiary)',
              fontWeight: 600,
              marginBottom: 4,
              padding: '0 2px',
            }}
          >
            <span>체결시각</span>
            <span style={{ textAlign: 'right' }}>체결가</span>
            <span style={{ textAlign: 'right' }}>체결량</span>
          </div>
          {fills.map((f, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', alignItems: 'center', height: 25, fontSize: 12 }}>
              <span className="num" style={{ color: 'var(--fg-tertiary)' }}>{f.time}</span>
              <span className="num" style={{ textAlign: 'right', fontWeight: 700, color: trendColor(f.dir) }}>{fmt(f.p)}</span>
              <span className="num" style={{ textAlign: 'right', color: 'var(--fg-secondary)' }}>{f.q.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ---- 일별 시세 표 (상세) ---------------------------------------------------

function DailyQuoteTable({ s }: { s: Stock }) {
  const rows = dailyQuotes(s)
  const fmt = (v: number) => (s.market === 'US' ? `$${v.toFixed(2)}` : KRW(Math.round(v)))
  const headCell = (h: string, align: 'left' | 'right') => (
    <div
      key={h}
      style={{
        fontSize: 'var(--text-badge)',
        color: 'var(--fg-tertiary)',
        fontWeight: 600,
        padding: '0 0 8px',
        textAlign: align,
        whiteSpace: 'nowrap',
      }}
    >
      {h}
    </div>
  )
  return (
    <Card style={{ padding: 16 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-secondary)', marginBottom: 10 }}>일별 시세</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.2fr) minmax(0,1fr) minmax(0,1.3fr)' }}>
        {headCell('일자', 'left')}
        {headCell('종가', 'right')}
        {headCell('등락률', 'right')}
        {headCell('거래량', 'right')}
        {rows.map(r => (
          <div key={r.date} style={{ display: 'contents' }}>
            <div className="num" style={{ fontSize: 12.5, color: 'var(--fg-secondary)', padding: '8px 0', borderTop: '1px solid var(--border-subtle)', whiteSpace: 'nowrap' }}>
              {r.date}
            </div>
            <div
              className="num"
              style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-primary)', padding: '8px 0', borderTop: '1px solid var(--border-subtle)', textAlign: 'right', whiteSpace: 'nowrap' }}
            >
              {fmt(r.close)}
            </div>
            <div
              className="num"
              style={{ fontSize: 12.5, fontWeight: 700, color: trendColor(r.chg), padding: '8px 0', borderTop: '1px solid var(--border-subtle)', textAlign: 'right', whiteSpace: 'nowrap' }}
            >
              {r.chg >= 0 ? '+' : ''}
              {r.chg.toFixed(2)}%
            </div>
            <div
              className="num"
              style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', padding: '8px 0', borderTop: '1px solid var(--border-subtle)', textAlign: 'right', whiteSpace: 'nowrap' }}
            >
              {r.vol.toLocaleString()}
              {s.market === 'US' ? 'M' : ''}
            </div>
          </div>
        ))}
      </div>
    </Card>
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

  // 국내 종목 상/하한가 (±30%, 호가단위 반올림)
  const tickOf = (p: number) => (p >= 100000 ? 500 : p >= 10000 ? 100 : p >= 1000 ? 10 : 1)
  const roundTick = (p: number) => {
    const t = tickOf(p)
    return Math.round(p / t) * t
  }
  const info: Array<{ k: string; v: string; c?: string }> = [
    { k: '시가총액', v: s.marketCap },
    { k: 'PER', v: s.per != null ? s.per.toFixed(1) : '—' },
    { k: 'EPS', v: s.eps != null ? (s.market === 'US' ? `$${s.eps.toFixed(2)}` : KRW(s.eps)) : '—' },
    ...(s.market === 'KR'
      ? [
          { k: '상한가', v: KRW(roundTick(s.price * 1.3)), c: 'var(--status-danger-fg)' },
          { k: '하한가', v: KRW(roundTick(s.price * 0.7)), c: 'var(--fg-brand)' },
        ]
      : []),
    { k: '52주 최고', v: s.market === 'US' ? `$${s.high52.toFixed(2)}` : KRW(s.high52) },
    { k: '52주 최저', v: s.market === 'US' ? `$${s.low52.toFixed(2)}` : KRW(s.low52) },
    { k: '거래량', v: s.vol },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 헤더: 종목명·관심 토글 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <StockBadge s={s} size={46} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: 'var(--fg-primary)',
              letterSpacing: '-0.01em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {s.name}
          </div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span>{s.ticker}</span>
            <Badge variant="secondary">{s.market === 'US' ? 'NASDAQ' : 'KRX·NXT'}</Badge>
            <span>·</span>
            <span>{s.sector}</span>
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
            borderRadius: tileRadius(38),
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
        <div style={{ marginTop: 8 }}>
          <Tabs value={range} onValueChange={v => setRange(v as (typeof RANGES)[number])}>
            <TabsList variant="pill" size="sm" style={{ width: '100%' }}>
              {RANGES.map(r => (
                <TabsTrigger key={r} variant="pill" value={r} style={{ flex: 1 }}>
                  {r}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
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
            ['매도가능', `${holding.qty}주`, 'var(--fg-secondary)'],
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

      {/* 호가/체결 + 기본정보 */}
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        <QuotesCard s={s} />
        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-secondary)', marginBottom: 12 }}>기본 정보</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {info.map((it, i) => (
              <div
                key={it.k}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '9px 0',
                  borderTop: i === 0 ? 0 : '1px solid var(--border-subtle)',
                }}
              >
                <span style={{ fontSize: 12.5, color: 'var(--fg-tertiary)' }}>{it.k}</span>
                <span className="num" style={{ fontSize: 'var(--text-label-sm)', fontWeight: 600, color: it.c ?? 'var(--fg-primary)' }}>
                  {it.v}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 일별 시세 */}
      <DailyQuoteTable s={s} />

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

      {/* 수수료 안내 — 토스증권 Open API 기준 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--bg-sunken)', borderRadius: 'var(--radius-md)' }}>
        <Info size={14} color="var(--fg-tertiary)" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-secondary)', lineHeight: 1.45 }}>
          {s.market === 'US'
            ? '미국주식 매매수수료 0.1% · 환전 수수료 별도 적용'
            : '국내주식 매매수수료 무료 (2026.6까지) · 이후 KRX 0.015% / NXT 0.014%'}
        </span>
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
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--fg-tertiary)',
              pointerEvents: 'none',
            }}
          />
          <Input
            search
            autoFocus
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="종목명 · 티커로 검색 (예: 삼성전자, NVDA)"
            className="w-full pl-9"
          />
        </div>
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
  // 토스 Open API 라이브 시세·환율 오버레이 (키 있으면 실데이터, 없으면 mock 유지)
  useStockLiveOverlay()
  const [selected, setSelected] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [seg, setSeg] = useState<'holdings' | 'watch' | 'discover'>('holdings')
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
      {/* 검색 트리거 — 전체 메뉴와 동일한 공통 패턴 (Input search variant, 36px) */}
      <div style={{ position: 'relative' }}>
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--fg-tertiary)',
            pointerEvents: 'none',
          }}
        />
        <Input
          search
          readOnly
          placeholder="종목 검색"
          className="w-full pl-9"
          style={{ cursor: 'pointer' }}
          onClick={() => setSearchOpen(true)}
        />
      </div>

      <Tabs value={seg} onValueChange={v => setSeg(v as 'holdings' | 'watch' | 'discover')}>
        <TabsList variant="pill" size="sm">
          <TabsTrigger variant="pill" value="holdings">
            보유 {STOCK_HOLDINGS.length}
          </TabsTrigger>
          <TabsTrigger variant="pill" value="watch">
            관심 {watchedTickers.size}
          </TabsTrigger>
          <TabsTrigger variant="pill" value="discover">
            발견
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {seg === 'discover' ? (
        <DiscoverPanel onPick={setSelected} selected={selected} />
      ) : seg === 'holdings' ? (
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
          <Tabs value={activeGroup} onValueChange={val => val && setActiveGroup(val)}>
            <TabsList variant="pill" size="sm">
              {watchGroups.map(g => (
                <TabsTrigger key={g.id} variant="pill" value={g.id}>
                  {g.name} <span style={{ opacity: 0.7 }}>{g.tickers.length}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
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

  // ---- 모바일: 풀스크린(← 헤더, 카드 혜택 패턴) + 스택 + 상세 시트 ----
  if (mobile) {
    return (
      <>
        <MobileBackHeader title="증권" />
        <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <IndexStrip mobile />
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
      </>
    )
  }

  // ---- 데스크톱/태블릿: 2-pane ----
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
        <MarketStatusBar />
        <IndexStrip mobile={false} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 420px) 1fr', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {summary}
          <PortfolioDonut holdings={STOCK_HOLDINGS} />
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
