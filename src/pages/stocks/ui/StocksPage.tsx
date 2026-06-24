import { useEffect, useMemo, useState } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { AlertTriangle, ChevronDown, ChevronUp, Info, LineChart, Search, Star } from 'lucide-react'
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
import { LightweightStockChart } from './LightweightStockChart'
import type {
  TossCandle,
  TossHoldingsItem,
  TossMarketSession,
  TossOrderbook,
  TossStockInfo,
  TossTrade,
} from '@/features/stock/api/stockApi'
import {
  useStockLiveOverlay,
  useTossAccounts,
  useTossCandles,
  useTossHoldings,
  useTossMarketCalendarKr,
  useTossMarketCalendarUs,
  useTossOrderbook,
  useTossPriceLimits,
  useTossStockInfo,
  useTossStockWarnings,
  useTossTrades,
} from '@/features/stock/model/useTossStocks'
import { useTossCredentialStatus } from '@/features/subscription/model/useSubscription'
import {
  FX_USDKRW,
  findStock,
  priceKRW,
  STOCK_WATCH,
  STOCKS,
  type Stock,
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

/** 서버가 String 으로 내려주는 금액/비율을 숫자로 파싱. */
function num(s: string | null | undefined): number {
  return s == null ? 0 : Number(s) || 0
}

/** 라이브 체결 테이프 변환 (토스 trades). dir=직전 체결가 대비 방향. */
function liveTradeFills(trades?: TossTrade[]): { time: string; p: number; q: number; dir: number }[] {
  if (!trades || trades.length === 0) return []
  return trades.slice(0, 12).map((t, i, arr) => {
    const p = Number.parseFloat(t.price)
    const prev = i + 1 < arr.length ? Number.parseFloat(arr[i + 1]!.price) : p
    const time = /(\d{2}:\d{2}:\d{2})/.exec(t.timestamp)?.[1] ?? t.timestamp
    return { time, p, q: Math.round(Number.parseFloat(t.volume)), dir: p >= prev ? 1 : -1 }
  })
}

/** 캔들 → 시간순(오름차순) 종가 배열. */
function candleCloses(candles: TossCandle[]): number[] {
  return [...candles]
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map(c => Number.parseFloat(c.closePrice))
    .filter(Number.isFinite)
}

// ---- 등락률 배지 (색 + 부호 + 아이콘 3중 병기 — A11y 1.4.1) ----------------

function PctBadge({ pct, size = 13 }: { pct: number; size?: number }) {
  const up = pct >= 0
  const Chevron = up ? ChevronUp : ChevronDown
  return (
    <span
      className="num"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: trendColor(pct), fontWeight: 700, fontSize: size }}
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

// ---- 미니 스파크라인 (리스트 행 — 큐레이트 카탈로그 spark) -------------------

function Sparkline({ values, height = 40, color, fill = true, gradientId }: { values: number[]; height?: number; color: string; fill?: boolean; gradientId?: string }) {
  if (values.length === 0) return null
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const w = 200
  const h = height
  const step = w / (values.length - 1)
  const pts = values.map((v, i) => [i * step, h - ((v - min) / range) * (h - 8) - 4] as const)
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

function StockRow({ ticker, onClick, sub, right, active }: { ticker: string; onClick: () => void; sub?: string; right?: React.ReactNode; active?: boolean }) {
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
        <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: 700, color: 'var(--fg-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {s.name}
        </div>
        <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
            <div className="num" style={{ fontSize: 'var(--text-body-sm)', fontWeight: 700, color: 'var(--fg-primary)' }}>{fmtPrice(s)}</div>
            <div style={{ marginTop: 1 }}>
              <PctBadge pct={s.changePct} size={11.5} />
            </div>
          </>
        )}
      </div>
    </button>
  )
}

// ---- 차트 기간 탭 (캔들 차트는 LightweightStockChart 가 담당) -----------------

const RANGES = ['1D', '1주', '1개월', '3개월', '1년'] as const
type Range = (typeof RANGES)[number]

// ---- 호가창 (토스 orderbook · 실데이터 전용) -------------------------------

function OrderBook({ s, book, changePct }: { s: Stock; book: TossOrderbook; changePct: number }) {
  const fmt = (p: number) => (s.market === 'US' ? `$${p.toFixed(2)}` : KRW(Math.round(p)))
  // asks=낮은가격순 → 상단(높은가격 위) 위해 5개 잘라 역순, bids=높은가격순 그대로.
  const asks = book.asks.slice(0, 5).map(e => ({ p: Number.parseFloat(e.price), q: Math.round(Number.parseFloat(e.volume)) })).reverse()
  const bids = book.bids.slice(0, 5).map(e => ({ p: Number.parseFloat(e.price), q: Math.round(Number.parseFloat(e.volume)) }))
  const maxQ = Math.max(1, ...asks.map(a => a.q), ...bids.map(b => b.q))

  const Row = ({ p, q, type }: { p: number; q: number; type: 'ask' | 'bid' }) => {
    const isAsk = type === 'ask'
    const col = isAsk ? 'var(--fg-brand)' : 'var(--status-danger-fg)'
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 92px 1fr', alignItems: 'center', height: 26 }}>
        {isAsk ? (
          <span />
        ) : (
          <div style={{ position: 'relative', height: 22, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${(q / maxQ) * 100}%`, background: 'color-mix(in oklab, var(--status-danger-fg) 13%, var(--bg-surface))', borderRadius: 4 }} />
            <span className="num" style={{ position: 'relative', fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', paddingRight: 6 }}>{q.toLocaleString()}</span>
          </div>
        )}
        <div style={{ textAlign: 'center', position: 'relative', height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="num" style={{ fontSize: 12.5, fontWeight: 700, color: col }}>{fmt(p)}</span>
        </div>
        {isAsk ? (
          <div style={{ position: 'relative', height: 22, display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(q / maxQ) * 100}%`, background: 'color-mix(in oklab, var(--fg-brand) 14%, var(--bg-surface))', borderRadius: 4 }} />
            <span className="num" style={{ position: 'relative', fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', paddingLeft: 6 }}>{q.toLocaleString()}</span>
          </div>
        ) : (
          <span />
        )}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 92px 1fr', fontSize: 10.5, color: 'var(--fg-tertiary)', fontWeight: 600, marginBottom: 4, padding: '0 2px' }}>
        <span style={{ textAlign: 'right', paddingRight: 6 }}>매수 잔량</span>
        <span />
        <span style={{ textAlign: 'left', paddingLeft: 6 }}>매도 잔량</span>
      </div>
      {asks.map((a, i) => (
        <Row key={`a${i}`} {...a} type="ask" />
      ))}
      <div style={{ borderTop: '1px dashed var(--border-subtle)', borderBottom: '1px dashed var(--border-subtle)', margin: '3px 0', padding: '5px 0', textAlign: 'center' }}>
        <span className="num" style={{ fontSize: 'var(--text-label-sm)', fontWeight: 800, color: trendColor(changePct) }}>{fmtPrice(s)}</span>
        <span style={{ marginLeft: 6 }}>
          <PctBadge pct={changePct} size={11} />
        </span>
      </div>
      {bids.map((b, i) => (
        <Row key={`b${i}`} {...b} type="bid" />
      ))}
    </div>
  )
}

// ---- 호가 / 체결 탭 카드 (실데이터 전용 · 로딩/빈 상태) -----------------------

function QuotesEmpty({ msg }: { msg: string }) {
  return <div style={{ padding: '36px 12px', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-label-sm)' }}>{msg}</div>
}

function QuotesCard({ s, changePct }: { s: Stock; changePct: number }) {
  const [tab, setTab] = useState<'book' | 'tape'>('book')
  const orderbookQ = useTossOrderbook(s.ticker)
  const tradesQ = useTossTrades(s.ticker)
  const fmt = (p: number) => (s.market === 'US' ? `$${p.toFixed(2)}` : KRW(Math.round(p)))
  const book = orderbookQ.data
  const hasBook = !!book && book.asks.length > 0 && book.bids.length > 0
  const fills = liveTradeFills(tradesQ.data)
  return (
    <Card style={{ padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <Tabs value={tab} onValueChange={v => setTab(v as 'book' | 'tape')}>
          <TabsList variant="pill" size="sm" style={{ width: '100%' }}>
            <TabsTrigger variant="pill" value="book" style={{ flex: 1 }}>호가</TabsTrigger>
            <TabsTrigger variant="pill" value="tape" style={{ flex: 1 }}>체결</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {tab === 'book' ? (
        orderbookQ.isLoading ? (
          <QuotesEmpty msg="호가를 불러오는 중이에요" />
        ) : hasBook ? (
          <OrderBook s={s} book={book} changePct={changePct} />
        ) : (
          <QuotesEmpty msg="호가 정보가 없어요" />
        )
      ) : tradesQ.isLoading ? (
        <QuotesEmpty msg="체결 내역을 불러오는 중이에요" />
      ) : fills.length === 0 ? (
        <QuotesEmpty msg="체결 내역이 없어요" />
      ) : (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', fontSize: 10.5, color: 'var(--fg-tertiary)', fontWeight: 600, marginBottom: 4, padding: '0 2px' }}>
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

// ---- 일별 시세 표 (토스 candles 1d) ---------------------------------------

function DailyQuoteTable({ symbol, isUs }: { symbol: string; isUs: boolean }) {
  const q = useTossCandles(symbol, '1d', 252)
  const fmt = (v: number) => (isUs ? `$${v.toFixed(2)}` : KRW(Math.round(v)))
  const rows = useMemo(() => {
    const asc = [...(q.data?.candles ?? [])].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    const recent = asc.slice(-9)
    const out: { date: string; close: number; chg: number; vol: number }[] = []
    for (let i = recent.length - 1; i >= 1; i--) {
      const c = recent[i]!
      const prev = Number.parseFloat(recent[i - 1]!.closePrice)
      const close = Number.parseFloat(c.closePrice)
      const chg = prev > 0 ? ((close - prev) / prev) * 100 : 0
      out.push({ date: c.timestamp.slice(5, 10).replace('-', '.'), close, chg, vol: Math.round(Number.parseFloat(c.volume)) })
    }
    return out.slice(0, 8)
  }, [q.data])

  const headCell = (h: string, align: 'left' | 'right') => (
    <div key={h} style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', fontWeight: 600, padding: '0 0 8px', textAlign: align, whiteSpace: 'nowrap' }}>
      {h}
    </div>
  )
  return (
    <Card style={{ padding: 16 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-secondary)', marginBottom: 10 }}>일별 시세</div>
      {q.isLoading ? (
        <QuotesEmpty msg="일별 시세를 불러오는 중이에요" />
      ) : rows.length === 0 ? (
        <QuotesEmpty msg="일별 시세가 없어요" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.2fr) minmax(0,1fr) minmax(0,1.3fr)' }}>
          {headCell('일자', 'left')}
          {headCell('종가', 'right')}
          {headCell('등락률', 'right')}
          {headCell('거래량', 'right')}
          {rows.map(r => (
            <div key={r.date} style={{ display: 'contents' }}>
              <div className="num" style={{ fontSize: 12.5, color: 'var(--fg-secondary)', padding: '8px 0', borderTop: '1px solid var(--border-subtle)', whiteSpace: 'nowrap' }}>{r.date}</div>
              <div className="num" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-primary)', padding: '8px 0', borderTop: '1px solid var(--border-subtle)', textAlign: 'right', whiteSpace: 'nowrap' }}>{fmt(r.close)}</div>
              <div className="num" style={{ fontSize: 12.5, fontWeight: 700, color: trendColor(r.chg), padding: '8px 0', borderTop: '1px solid var(--border-subtle)', textAlign: 'right', whiteSpace: 'nowrap' }}>
                {r.chg >= 0 ? '+' : ''}
                {r.chg.toFixed(2)}%
              </div>
              <div className="num" style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', padding: '8px 0', borderTop: '1px solid var(--border-subtle)', textAlign: 'right', whiteSpace: 'nowrap' }}>{r.vol.toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ---- 장 상태 바 (토스 market-calendar) ------------------------------------

const WARNING_LABELS: Record<string, string> = {
  LIQUIDATION_TRADING: '정리매매',
  OVERHEATED: '단기과열',
  SHORT_TERM_OVERHEAT: '단기과열',
  EXCESSIVE_RISE: '이상급등',
  INVESTMENT_WARNING: '투자경고',
  INVESTMENT_RISK: '투자위험',
  INVESTMENT_CAUTION: '투자주의',
  VI: 'VI 발동',
  VI_STATIC: '정적 VI',
  VI_DYNAMIC: '동적 VI',
  VI_STATIC_AND_DYNAMIC: 'VI 발동',
  STOCK_WARRANTS: '신주인수권',
  ADMINISTRATIVE: '관리종목',
  ADJUSTMENT_OF_SHARES: '주식병합·분할',
}
const warningLabel = (t: string) => WARNING_LABELS[t] ?? t

/** 'HH:MM:SS' → 'HH:MM' */
const hhmm = (t?: string | null) => (t ? t.slice(0, 5) : null)

/** 시장 현지 시각 'HH:MM' (TZ 무관 — Intl) */
function nowInTz(tz: string): string {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit' }).formatToParts(new Date())
  const h = p.find(x => x.type === 'hour')?.value ?? '00'
  const m = p.find(x => x.type === 'minute')?.value ?? '00'
  return `${h}:${m}`
}

function marketState(session: TossMarketSession | null | undefined, tz: string): { open: boolean; detail: string } {
  const start = hhmm(session?.startTime)
  const end = hhmm(session?.endTime)
  if (!start || !end) return { open: false, detail: '휴장' }
  const now = nowInTz(tz)
  if (now >= start && now <= end) return { open: true, detail: `장중 · ${now}` }
  if (now < start) return { open: false, detail: `개장 ${start}` }
  return { open: false, detail: '장마감' }
}

function MarketStatusBar({ mobile }: { mobile: boolean }) {
  const krQ = useTossMarketCalendarKr()
  const usQ = useTossMarketCalendarUs()
  const kr = marketState(krQ.data?.today.integrated?.regularMarket, 'Asia/Seoul')
  const us = marketState(usQ.data?.today.regularMarket, 'America/New_York')
  const markets = [
    { name: mobile ? '국내' : '국내 (KRX·NXT)', ...kr },
    { name: mobile ? '미국' : '미국 (NASDAQ)', ...us },
  ]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: mobile ? 8 : 16, flexWrap: 'wrap' }}>
      {markets.map(m => (
        <div
          key={m.name}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            ...(mobile ? { background: 'var(--bg-sunken)', padding: '5px 11px', borderRadius: 'var(--radius-full)' } : {}),
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: 'var(--radius-full)', flexShrink: 0, background: m.open ? 'var(--status-success-fg)' : 'var(--fg-tertiary)' }} />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-primary)' }}>{m.name}</span>
          <span style={{ fontSize: 'var(--text-caption)', color: m.open ? 'var(--fg-secondary)' : 'var(--fg-tertiary)' }}>{m.detail}</span>
        </div>
      ))}
      {!mobile && <span style={{ marginLeft: 'auto', fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)' }}>토스증권 Open API · 시세 지연 표시</span>}
    </div>
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

function HoldingsEmpty() {
  return (
    <Card style={{ padding: '32px 20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
        <div style={{ fontSize: 'var(--text-body-md)', fontWeight: 700, color: 'var(--fg-primary)' }}>증권 계정을 연결해 주세요</div>
        <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--fg-tertiary)' }}>토스증권 키를 연결하면 보유 종목과 평가손익을 실시간으로 볼 수 있어요.</div>
        <Button variant="outline" size="sm" style={{ marginTop: 8 }} asChild>
          <Link to="/desk/settings">설정에서 연결하기</Link>
        </Button>
      </div>
    </Card>
  )
}

function PortfolioDonut({ holdings }: { holdings: TossHoldingsItem[] }) {
  const rows = holdings
    .map((h, i) => ({ name: h.name || h.symbol, value: num(h.marketValue.amount), color: DONUT_PALETTE[i % DONUT_PALETTE.length]! }))
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
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
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

// ---- 발견(디스커버리) 랭킹 — 큐레이트 universe 실시세 정렬 --------------------

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
          <TabsTrigger variant="pill" value="gainers">급상승</TabsTrigger>
          <TabsTrigger variant="pill" value="losers">급하락</TabsTrigger>
          <TabsTrigger variant="pill" value="volume">거래량</TabsTrigger>
        </TabsList>
      </Tabs>
      <Card style={{ padding: 6 }}>
        {list.map((s, i) => (
          <div key={s.ticker} style={{ display: 'flex', alignItems: 'center' }}>
            <span className="num" style={{ width: 22, textAlign: 'center', flexShrink: 0, fontSize: 'var(--text-label-sm)', fontWeight: 700, color: i < 3 ? 'var(--fg-brand)' : 'var(--fg-tertiary)' }}>
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

// ---- 종목 기본정보 (토스 stocks + price-limits) ----------------------------

const TRILLION = 1e12
const HUNDRED_M = 1e8

function fmtCapKRW(v: number): string {
  if (v >= TRILLION) return `${(v / TRILLION).toFixed(1)}조원`
  return `${Math.round(v / HUNDRED_M).toLocaleString()}억원`
}
function fmtShares(n: number): string {
  if (n >= HUNDRED_M) return `${(n / HUNDRED_M).toFixed(n >= 1e9 ? 0 : 1)}억 주`
  return `${Math.round(n / 1e4).toLocaleString()}만 주`
}

function StockInfoCard({ s, info, isUs }: { s: Stock; info: TossStockInfo | undefined; isUs: boolean }) {
  const limitsQ = useTossPriceLimits(s.ticker)
  const limits = limitsQ.data
  const shares = num(info?.sharesOutstanding)
  const mcKRW = priceKRW(s) * shares
  const isKr = s.market === 'KR'
  const upper = limits?.upperLimitPrice ? num(limits.upperLimitPrice) : null
  const lower = limits?.lowerLimitPrice ? num(limits.lowerLimitPrice) : null
  const rows: Array<{ k: string; v: string; c?: string }> = [
    { k: '시장', v: info ? info.market : isUs ? '미국' : '국내' },
    { k: '종목 유형', v: info?.securityType === 'ETF' ? 'ETF' : '주식' },
    { k: '통화', v: info?.currency ?? (isUs ? 'USD' : 'KRW') },
    ...(shares > 0 ? [{ k: '시가총액', v: fmtCapKRW(mcKRW) }] : []),
    ...(isKr && upper != null ? [{ k: '상한가', v: `${KRW(upper)}원`, c: 'var(--status-danger-fg)' }] : []),
    ...(isKr && lower != null ? [{ k: '하한가', v: `${KRW(lower)}원`, c: 'var(--fg-brand)' }] : []),
    ...(info?.listDate ? [{ k: '상장일', v: info.listDate }] : []),
    ...(shares > 0 ? [{ k: '발행주식수', v: fmtShares(shares) }] : []),
    {
      k: '거래상태',
      // 거래정지는 토스 status(분류성 값)가 아니라 KRX 거래정지 플래그로 판정.
      v: info?.koreanMarketDetail?.krxTradingSuspended ? '거래정지' : '정상',
      c: info?.koreanMarketDetail?.krxTradingSuspended ? 'var(--status-danger-fg)' : 'var(--status-success-fg)',
    },
  ]
  return (
    <Card style={{ padding: 16 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-secondary)', marginBottom: 12 }}>기본 정보</div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {rows.map((it, i) => (
          <div key={it.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderTop: i === 0 ? 0 : '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 12.5, color: 'var(--fg-tertiary)' }}>{it.k}</span>
            <span className="num" style={{ fontSize: 'var(--text-label-sm)', fontWeight: 600, color: it.c ?? 'var(--fg-primary)' }}>{it.v}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ---- 종목 상세 본문 ------------------------------------------------------

function StockDetailBody({ ticker, holding, watched, onToggleWatch, mobile }: { ticker: string; holding: TossHoldingsItem | null; watched: boolean; onToggleWatch: () => void; mobile: boolean }) {
  const [range, setRange] = useState<Range>('1D')
  const s = findStock(ticker)
  const infoQ = useTossStockInfo([ticker])
  const warningsQ = useTossStockWarnings(ticker)
  const dailyQ = useTossCandles(ticker, '1d', 252)
  if (!s) return null
  const info = infoQ.data?.[0]
  const isUs = s.market === 'US'
  const warnings = warningsQ.data ?? []

  // 등락률 — 1d 캔들(현재가 vs 전일 종가)로 실산출, 미연동 시 카탈로그 fallback.
  const changePct = (() => {
    const asc = candleCloses(dailyQ.data?.candles ?? [])
    const prev = asc.length >= 2 ? asc[asc.length - 2]! : 0
    if (prev > 0) return ((s.price - prev) / prev) * 100
    return s.changePct
  })()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 헤더: 종목명·관심 토글 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <StockBadge s={s} size={46} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--fg-primary)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {s.name}
          </div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span>{s.ticker}</span>
            <Badge variant="secondary">{info ? info.market : isUs ? 'NASDAQ' : 'KRX·NXT'}</Badge>
            <span>·</span>
            <span>{info?.securityType === 'ETF' ? 'ETF' : s.sector}</span>
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
        <div className="num" style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-primary)' }}>{fmtPrice(s)}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <PctBadge pct={changePct} size={14} />
          {isUs && <span className="num" style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>≈ {KRW(priceKRW(s))}원</span>}
        </div>
      </div>

      {/* 매수 유의사항 (토스 warnings) */}
      {warnings.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {warnings.map((w, i) => (
            <span
              key={i}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 'var(--text-badge)',
                fontWeight: 700,
                padding: '4px 9px',
                borderRadius: 'var(--radius-full)',
                background: 'color-mix(in oklab, var(--status-warning) 16%, var(--bg-surface))',
                color: 'var(--status-warning-fg)',
              }}
            >
              <AlertTriangle size={12} strokeWidth={2.4} />
              {warningLabel(w.warningType)}
            </span>
          ))}
        </div>
      )}

      {/* 차트 (토스 candles) + 기간 세그먼트 */}
      <Card style={{ padding: mobile ? '14px 14px 14px' : '16px 18px 16px' }}>
        <div style={{ height: mobile ? 168 : 200 }}>
          <LightweightStockChart symbol={ticker} isUs={isUs} range={range} height={mobile ? 168 : 200} />
        </div>
        <div style={{ marginTop: 8 }}>
          <Tabs value={range} onValueChange={v => setRange(v as Range)}>
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
          const ev = num(holding.marketValue.amount)
          const pnl = num(holding.profitLoss.amount)
          const pnlPct = num(holding.profitLoss.rate)
          const avg = num(holding.averagePurchasePrice)
          const dayPnl = num(holding.dailyProfitLoss.amount)
          const purchase = num(holding.marketValue.purchaseAmount)
          const fees = num(holding.cost.commission) + num(holding.cost.tax ?? '0')
          const heldUs = holding.marketCountry.toUpperCase() === 'US' || holding.currency.toUpperCase() === 'USD'
          const rows: Array<[string, React.ReactNode, string]> = [
            ['평가금액', <MaskAmount key="ev">{`${KRW(ev)}원`}</MaskAmount>, 'var(--fg-primary)'],
            ['평가손익', <MaskAmount key="pnl">{`${pnl >= 0 ? '+' : '−'}${KRW(pnl, { abs: true })}원`}</MaskAmount>, trendColor(pnl)],
            ['보유수량', `${holding.quantity}주`, 'var(--fg-primary)'],
            ['수익률', `${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%`, trendColor(pnl)],
            ['일간 손익', <MaskAmount key="day">{`${dayPnl >= 0 ? '+' : '−'}${KRW(dayPnl, { abs: true })}원`}</MaskAmount>, trendColor(dayPnl)],
            ['평균단가', heldUs ? `$${avg.toFixed(2)}` : `${KRW(Math.round(avg))}원`, 'var(--fg-secondary)'],
            ['매입금액', <MaskAmount key="cost">{`${KRW(purchase)}원`}</MaskAmount>, 'var(--fg-secondary)'],
            ['수수료·세금', `${KRW(fees)}원`, 'var(--fg-secondary)'],
            ['매도가능', `${holding.quantity}주`, 'var(--fg-secondary)'],
          ]
          return (
            <Card style={{ padding: 16 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-secondary)', marginBottom: 12 }}>내 보유</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 10px' }}>
                {rows.map(([k, v, c]) => (
                  <div key={k}>
                    <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', marginBottom: 2 }}>{k}</div>
                    <div className="num" style={{ fontSize: 'var(--text-body-sm)', fontWeight: 700, color: c }}>{v}</div>
                  </div>
                ))}
              </div>
            </Card>
          )
        })()}

      {/* 호가/체결 + 기본정보 */}
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        <QuotesCard s={s} changePct={changePct} />
        <StockInfoCard s={s} info={info} isUs={isUs} />
      </div>

      {/* 일별 시세 */}
      <DailyQuoteTable symbol={ticker} isUs={isUs} />

      {/* 매매 (모의) — 매도=primary(파랑), 매수=destructive(빨강) — 국내 통념 */}
      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="default" size="lg" style={{ flex: 1 }} onClick={() => toast(`${s.name} 매도 주문 — Open API 연동 시 동작`)}>
          매도
        </Button>
        <Button variant="destructive" size="lg" style={{ flex: 1 }} onClick={() => toast(`${s.name} 매수 주문 — Open API 연동 시 동작`)}>
          매수
        </Button>
      </div>

      {/* 수수료 안내 — 토스증권 Open API 기준 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--bg-sunken)', borderRadius: 'var(--radius-md)' }}>
        <Info size={14} color="var(--fg-tertiary)" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-secondary)', lineHeight: 1.45 }}>
          {isUs ? '미국주식 매매수수료 0.1% · 환전 수수료 별도 적용' : '국내주식 매매수수료 무료 (2026.6까지) · 이후 KRX 0.015% / NXT 0.014%'}
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

function StockSearchDialog({ mobile, onPick, onClose }: { mobile: boolean; onPick: (ticker: string) => void; onClose: () => void }) {
  const [q, setQ] = useState('')
  const ql = q.trim().toLowerCase()
  const results = ql ? STOCKS.filter(s => s.name.toLowerCase().includes(ql) || s.ticker.toLowerCase().includes(ql) || s.sector.includes(q.trim())) : STOCKS
  return (
    <ModalShell title="종목 검색" onClose={onClose} mobile={mobile} mobileMinHeight="85dvh">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-tertiary)', pointerEvents: 'none' }} />
          <Input search autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="종목명 · 티커로 검색 (예: 삼성전자, NVDA)" className="w-full pl-9" />
        </div>
        <div style={{ maxHeight: mobile ? undefined : '56vh', overflowY: 'auto' }}>
          {results.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-label-sm)' }}>'{q}' 검색 결과가 없어요</div>
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
  // 개인키 연결 상태 — 미연결 시 페이지 전체를 '연결 유도'로 게이트(mock 노출 금지).
  const { data: credential, isLoading: credLoading } = useTossCredentialStatus()
  const connected = credential?.connected ?? false
  // 토스 Open API 라이브 시세·환율 오버레이 (연결 시에만 실데이터 적용)
  useStockLiveOverlay()
  const [selected, setSelected] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [seg, setSeg] = useState<'holdings' | 'watch' | 'discover'>('holdings')
  const [watchGroups, setWatchGroups] = useState<WatchGroup[]>(STOCK_WATCH)
  const [activeGroup, setActiveGroup] = useState(STOCK_WATCH[0]!.id)

  // 보유자산 — 키 연결 시 실데이터(/toss/accounts→/toss/holdings), 미연결 시 빈 상태.
  const { data: accounts } = useTossAccounts()
  const accountSeq = accounts?.[0]?.accountSeq ?? null
  const { data: holdings } = useTossHoldings(accountSeq)
  const holdingItems = useMemo(
    () => (holdings ? [...holdings.items].sort((a, b) => num(b.marketValue.amount) - num(a.marketValue.amount)) : []),
    [holdings],
  )

  // 데스크톱: 기본 선택 = 첫 보유 종목
  useEffect(() => {
    if (!mobile && !selected && holdingItems.length > 0) setSelected(holdingItems[0]!.symbol)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobile, holdingItems.length])

  const watchedTickers = useMemo(() => new Set(watchGroups.flatMap(g => g.tickers)), [watchGroups])
  const isWatched = (t: string) => watchedTickers.has(t)
  const toggleWatch = (t: string) => {
    setWatchGroups(prev => {
      const inSome = prev.some(g => g.tickers.includes(t))
      if (inSome) return prev.map(g => ({ ...g, tickers: g.tickers.filter(x => x !== t) }))
      return prev.map(g => (g.id === activeGroup ? { ...g, tickers: [...g.tickers, t] } : g))
    })
  }

  // 요약 (서버 계산값)
  const totalEval = holdings ? num(holdings.marketValue.amount.krw) : 0
  const totalCost = holdings ? num(holdings.totalPurchaseAmount.krw) : 0
  const totalPnl = holdings ? num(holdings.profitLoss.amount.krw) : 0
  const totalPnlPct = holdings ? num(holdings.profitLoss.rate) : 0
  const curGroup = watchGroups.find(g => g.id === activeGroup) ?? watchGroups[0]!
  const selHolding = selected ? holdingItems.find(h => h.symbol === selected) ?? null : null

  const summary = !holdings ? (
    <Card style={{ padding: mobile ? 18 : 22 }}>
      <div style={{ fontSize: 12.5, color: 'var(--fg-tertiary)', fontWeight: 600 }}>내 투자 평가금액</div>
      <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--fg-tertiary)', marginTop: 8 }}>증권 계정을 연결하면 보유자산이 보여요</div>
    </Card>
  ) : (
    <Card style={{ padding: mobile ? 18 : 22 }}>
      <div style={{ fontSize: 12.5, color: 'var(--fg-tertiary)', fontWeight: 600 }}>내 투자 평가금액</div>
      <div className="num" style={{ fontSize: mobile ? 28 : 32, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-primary)', marginTop: 4 }}>
        <MaskAmount>{KRW(totalEval)}</MaskAmount>원
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
        <span className="num" style={{ fontSize: 'var(--text-body-sm)', fontWeight: 700, color: trendColor(totalPnl), whiteSpace: 'nowrap' }}>
          <MaskAmount>{`${totalPnl >= 0 ? '+' : '−'}${KRW(totalPnl, { abs: true })}원`}</MaskAmount>
        </span>
        <PctBadge pct={totalPnlPct} size={13} />
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
        {(
          [
            ['매입금액', <MaskAmount key="c">{`${KRW(totalCost)}원`}</MaskAmount>],
            ['보유 종목', `${holdingItems.length}개`],
            ['환율(USD)', `₩${FX_USDKRW.toLocaleString()}`],
          ] as Array<[string, React.ReactNode]>
        ).map(([k, v]) => (
          <div key={k} style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', marginBottom: 2 }}>{k}</div>
            <div className="num" style={{ fontSize: 'var(--text-body-sm)', fontWeight: 700, color: 'var(--fg-primary)' }}>{v}</div>
          </div>
        ))}
      </div>
    </Card>
  )

  const listPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-tertiary)', pointerEvents: 'none' }} />
        <Input search readOnly placeholder="종목 검색" className="w-full pl-9" style={{ cursor: 'pointer' }} onClick={() => setSearchOpen(true)} />
      </div>

      <Tabs value={seg} onValueChange={v => setSeg(v as 'holdings' | 'watch' | 'discover')}>
        <TabsList variant="pill" size="sm">
          <TabsTrigger variant="pill" value="holdings">보유 {holdingItems.length}</TabsTrigger>
          <TabsTrigger variant="pill" value="watch">관심 {watchedTickers.size}</TabsTrigger>
          <TabsTrigger variant="pill" value="discover">발견</TabsTrigger>
        </TabsList>
      </Tabs>

      {seg === 'discover' ? (
        <DiscoverPanel onPick={setSelected} selected={selected} />
      ) : seg === 'holdings' ? (
        !holdings ? (
          <HoldingsEmpty />
        ) : holdingItems.length === 0 ? (
          <Card style={{ padding: 6 }}>
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-label-sm)' }}>보유 중인 종목이 없어요.</div>
          </Card>
        ) : (
          <Card style={{ padding: 6 }}>
            {holdingItems.map(h => {
              const ev = num(h.marketValue.amount)
              const pnl = num(h.profitLoss.amount)
              const pct = num(h.profitLoss.rate)
              return (
                <StockRow
                  key={h.symbol}
                  ticker={h.symbol}
                  active={selected === h.symbol}
                  onClick={() => setSelected(h.symbol)}
                  sub={`${h.quantity}주 보유`}
                  right={
                    <>
                      <div className="num" style={{ fontSize: 'var(--text-body-sm)', fontWeight: 700, color: 'var(--fg-primary)' }}>
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
        )
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
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-label-sm)' }}>관심 종목이 없어요. 검색해서 별표를 눌러보세요.</div>
            ) : (
              curGroup.tickers.map(t => <StockRow key={t} ticker={t} active={selected === t} onClick={() => setSelected(t)} />)
            )}
          </Card>
        </>
      )}
    </div>
  )

  // ---- 개인키 미연결: 전 화면 연결 유도 (mock 노출 금지) ----
  if (!credLoading && !connected) {
    const gate = (
      <Card style={{ padding: '40px 24px', maxWidth: 430, margin: mobile ? undefined : '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
          <div style={{ fontSize: 'var(--text-body-md)', fontWeight: 700, color: 'var(--fg-primary)' }}>증권 계정을 연결해 주세요</div>
          <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--fg-tertiary)', lineHeight: 1.5 }}>
            토스증권 키를 연결하면 시세·보유 종목·평가손익을
            <br />
            실시간으로 볼 수 있어요.
          </div>
          <Button variant="outline" size="sm" style={{ marginTop: 8 }} asChild>
            <Link to="/desk/settings">설정에서 연결하기</Link>
          </Button>
        </div>
      </Card>
    )
    return mobile ? (
      <>
        <MobileBackHeader title="증권" />
        <div style={{ padding: '16px 16px 24px' }}>{gate}</div>
      </>
    ) : (
      <div style={{ padding: 24 }}>{gate}</div>
    )
  }

  // ---- 모바일: 풀스크린(← 헤더) + 스택 + 상세 시트 ----
  if (mobile) {
    return (
      <>
        <MobileBackHeader title="증권" />
        <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <MarketStatusBar mobile />
          {summary}
          {listPanel}
          {selected && (
            <ModalShell title="종목 상세" onClose={() => setSelected(null)} mobile mobileMinHeight="88dvh">
              <StockDetailBody ticker={selected} holding={selHolding} watched={isWatched(selected)} onToggleWatch={() => toggleWatch(selected)} mobile />
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
        <MarketStatusBar mobile={false} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 400px) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {summary}
          {holdings && holdingItems.length > 0 && <PortfolioDonut holdings={holdingItems} />}
          {listPanel}
        </div>
        <Card style={{ padding: 24 }}>
          {selected ? (
            <StockDetailBody ticker={selected} holding={selHolding} watched={isWatched(selected)} onToggleWatch={() => toggleWatch(selected)} mobile={false} />
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
