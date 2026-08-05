import { useEffect, useMemo, useState } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { AlertTriangle, ChevronDown, ChevronUp, Info, LineChart, Pencil, Plus, Search, Star } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { tileRadius } from '@/shared/lib'
import { KRW, money } from '@/shared/lib/porest/format'
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
  StockMasterItem,
  TossHoldingsItem,
  TossMarketSession,
  TossOrderbook,
  TossRankingItem,
  TossStockInfo,
  TossTrade,
  WatchGroup,
} from '@/features/stock/api/stockApi'
import {
  changePctOf,
  usePrevClose,
  useTossAccounts,
  useTossCandles,
  useTossExchangeRate,
  useTossHoldings,
  useTossIndicatorPrices,
  useTossMarketCalendarKr,
  useTossMarketCalendarUs,
  useTossOrderbook,
  useTossPriceLimits,
  useTossPrices,
  useTossRankings,
  useTossStockInfo,
  useTossStockWarnings,
  useTossTrades,
} from '@/features/stock/model/useTossStocks'
import { useStockBySymbol, useStockSearch } from '@/features/stock/model/useStockMaster'
import {
  findWatchEntries,
  useAddWatchItem,
  useCreateWatchGroup,
  useDeleteWatchGroup,
  useRemoveWatchItem,
  useRenameWatchGroup,
  useWatchGroups,
} from '@/features/stock/api/watchlistApi'
import { useTossCredentialStatus } from '@/features/subscription/model/useSubscription'

type OutletCtx = { onAddTx: () => void; mobile: boolean }

// ---- 시세 포맷 ----------------------------------------------------------

/** 통화별 가격 표기 — KRW 는 원화 포맷, USD 는 $, 그 외(CNY·JPY 등)는 통화코드 병기. */
function fmtByCurrency(price: number, currency: string): string {
  if (currency === 'USD') return `$${price.toFixed(2)}`
  if (currency === 'KRW') return money(Math.round(price))
  return `${price.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency}`
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

// ---- 종목 심볼 배지 — 국가별 색 (다크 자동 light swap) -----------------------

const COUNTRY_TONE: Record<string, string> = {
  KR: 'var(--color-cat-blue)',
  US: 'var(--color-cat-violet)',
  CN: 'var(--color-cat-orange)',
  JP: 'var(--color-cat-pink)',
  HK: 'var(--color-cat-green)',
  VN: 'var(--color-cat-indigo)',
}

function StockBadge({ name, symbol, countryCode, size = 40 }: { name: string; symbol: string; countryCode: string; size?: number }) {
  const tone = COUNTRY_TONE[countryCode] ?? 'var(--color-cat-blue)'
  // 한글명은 첫 글자, 알파벳 심볼은 앞 2글자.
  const initial = /^[A-Za-z]/.test(symbol) ? symbol.slice(0, 2) : name.slice(0, 1)
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
      {initial}
    </span>
  )
}

// ---- 종목 리스트 행 (표시 전용 — 데이터는 각 패널이 공급) ---------------------

type RowStock = { symbol: string; name: string; countryCode: string; currency: string }

function StockRow({
  stock,
  onClick,
  sub,
  price,
  changePct,
  right,
  active,
}: {
  stock: RowStock
  onClick: () => void
  sub?: string
  price?: number | null
  changePct?: number | null
  right?: React.ReactNode
  active?: boolean
}) {
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
      <StockBadge name={stock.name} symbol={stock.symbol} countryCode={stock.countryCode} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: 700, color: 'var(--fg-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {stock.name}
        </div>
        <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <span style={{ fontWeight: 600 }}>{stock.symbol}</span>
          {sub && (
            <>
              <span>·</span>
              <span style={{ whiteSpace: 'nowrap' }}>{sub}</span>
            </>
          )}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 78 }}>
        {right ?? (
          <>
            <div className="num" style={{ fontSize: 'var(--text-body-sm)', fontWeight: 700, color: 'var(--fg-primary)' }}>
              {price != null ? fmtByCurrency(price, stock.currency) : '—'}
            </div>
            {changePct != null && (
              <div style={{ marginTop: 1 }}>
                <PctBadge pct={changePct} size={11.5} />
              </div>
            )}
          </>
        )}
      </div>
    </button>
  )
}

// ---- 차트 기간 탭 (캔들 차트는 LightweightStockChart 가 담당) -----------------

const RANGES = ['1D', '1주', '1개월', '3개월', '1년'] as const
type Range = (typeof RANGES)[number]
// 기간 값은 LightweightStockChart·임베드 querystring 의 식별자이므로 보존하고, 표시 라벨만 i18n.
const RANGE_LABEL_KEY: Record<Range, string> = {
  '1D': 'range.1d',
  '1주': 'range.1w',
  '1개월': 'range.1m',
  '3개월': 'range.3m',
  '1년': 'range.1y',
}

// ---- 호가창 (토스 orderbook · 실데이터 전용) -------------------------------

function OrderBook({ currency, lastPrice, book, changePct }: { currency: string; lastPrice: number | null; book: TossOrderbook; changePct: number }) {
  const { t } = useTranslation('stocks')
  const fmt = (p: number) => fmtByCurrency(p, currency)
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
        <span style={{ textAlign: 'right', paddingRight: 6 }}>{t('orderbook.bidVolume')}</span>
        <span />
        <span style={{ textAlign: 'left', paddingLeft: 6 }}>{t('orderbook.askVolume')}</span>
      </div>
      {asks.map((a, i) => (
        <Row key={`a${i}`} {...a} type="ask" />
      ))}
      <div style={{ borderTop: '1px dashed var(--border-subtle)', borderBottom: '1px dashed var(--border-subtle)', margin: '3px 0', padding: '5px 0', textAlign: 'center' }}>
        <span className="num" style={{ fontSize: 'var(--text-label-sm)', fontWeight: 800, color: trendColor(changePct) }}>
          {lastPrice != null ? fmt(lastPrice) : '—'}
        </span>
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

function QuotesCard({ symbol, currency, lastPrice, changePct }: { symbol: string; currency: string; lastPrice: number | null; changePct: number }) {
  const { t } = useTranslation('stocks')
  const [tab, setTab] = useState<'book' | 'tape'>('book')
  const orderbookQ = useTossOrderbook(symbol)
  const tradesQ = useTossTrades(symbol)
  const fmt = (p: number) => fmtByCurrency(p, currency)
  const book = orderbookQ.data
  const hasBook = !!book && book.asks.length > 0 && book.bids.length > 0
  const fills = liveTradeFills(tradesQ.data)
  return (
    <Card style={{ padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <Tabs value={tab} onValueChange={v => setTab(v as 'book' | 'tape')}>
          <TabsList variant="pill" size="sm" style={{ width: '100%' }}>
            <TabsTrigger variant="pill" value="book" style={{ flex: 1 }}>{t('quotes.orderbook')}</TabsTrigger>
            <TabsTrigger variant="pill" value="tape" style={{ flex: 1 }}>{t('quotes.trades')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {tab === 'book' ? (
        orderbookQ.isLoading ? (
          <QuotesEmpty msg={t('quotes.orderbookLoading')} />
        ) : hasBook ? (
          <OrderBook currency={currency} lastPrice={lastPrice} book={book} changePct={changePct} />
        ) : (
          <QuotesEmpty msg={t('quotes.orderbookEmpty')} />
        )
      ) : tradesQ.isLoading ? (
        <QuotesEmpty msg={t('quotes.tradesLoading')} />
      ) : fills.length === 0 ? (
        <QuotesEmpty msg={t('quotes.tradesEmpty')} />
      ) : (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', fontSize: 10.5, color: 'var(--fg-tertiary)', fontWeight: 600, marginBottom: 4, padding: '0 2px' }}>
            <span>{t('quotes.tradeTime')}</span>
            <span style={{ textAlign: 'right' }}>{t('quotes.tradePrice')}</span>
            <span style={{ textAlign: 'right' }}>{t('quotes.tradeVolume')}</span>
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

function DailyQuoteTable({ symbol, currency }: { symbol: string; currency: string }) {
  const { t } = useTranslation('stocks')
  const q = useTossCandles(symbol, '1d', 252)
  const fmt = (v: number) => fmtByCurrency(v, currency)
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
      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-secondary)', marginBottom: 10 }}>{t('daily.title')}</div>
      {q.isLoading ? (
        <QuotesEmpty msg={t('daily.loading')} />
      ) : rows.length === 0 ? (
        <QuotesEmpty msg={t('daily.empty')} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.2fr) minmax(0,1fr) minmax(0,1.3fr)' }}>
          {headCell(t('daily.date'), 'left')}
          {headCell(t('daily.close'), 'right')}
          {headCell(t('daily.changeRate'), 'right')}
          {headCell(t('daily.volume'), 'right')}
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

// ---- 장 상태 바 (토스 market-calendar + 국내 지수) --------------------------

/** 'HH:MM:SS' → 'HH:MM' */
const hhmm = (t?: string | null) => (t ? t.slice(0, 5) : null)

/** 시장 현지 시각 'HH:MM' (TZ 무관 — Intl) */
function nowInTz(tz: string): string {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit' }).formatToParts(new Date())
  const h = p.find(x => x.type === 'hour')?.value ?? '00'
  const m = p.find(x => x.type === 'minute')?.value ?? '00'
  return `${h}:${m}`
}

type MarketStatus = { open: boolean; labelKey: string; time?: string }

function marketState(session: TossMarketSession | null | undefined, tz: string): MarketStatus {
  const start = hhmm(session?.startTime)
  const end = hhmm(session?.endTime)
  if (!start || !end) return { open: false, labelKey: 'market.holiday' }
  const now = nowInTz(tz)
  if (now >= start && now <= end) return { open: true, labelKey: 'market.live', time: now }
  if (now < start) return { open: false, labelKey: 'market.preopen', time: start }
  return { open: false, labelKey: 'market.afterClose' }
}

function MarketStatusBar({ mobile }: { mobile: boolean }) {
  const { t } = useTranslation('stocks')
  const krQ = useTossMarketCalendarKr()
  const usQ = useTossMarketCalendarUs()
  // 국내 지수 현재가 (토스 시장지표 — KOSPI·KOSDAQ 포인트)
  const idxQ = useTossIndicatorPrices(['KOSPI', 'KOSDAQ'])
  const kr = marketState(krQ.data?.today.integrated?.regularMarket, 'Asia/Seoul')
  const us = marketState(usQ.data?.today.regularMarket, 'America/New_York')
  const markets = [
    { name: mobile ? t('market.krShort') : t('market.krFull'), ...kr },
    { name: mobile ? t('market.usShort') : t('market.usFull'), ...us },
  ]
  const indices = (idxQ.data ?? []).filter(i => num(i.lastPrice) > 0)
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
          <span style={{ fontSize: 'var(--text-caption)', color: m.open ? 'var(--fg-secondary)' : 'var(--fg-tertiary)' }}>{t(m.labelKey, m.time ? { time: m.time } : undefined)}</span>
        </div>
      ))}
      {indices.map(i => (
        <div key={i.symbol} style={{ display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-secondary)' }}>
            {i.symbol === 'KOSPI' ? t('market.KOSPI') : t('market.KOSDAQ')}
          </span>
          <span className="num" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-primary)' }}>
            {num(i.lastPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        </div>
      ))}
      {!mobile && <span style={{ marginLeft: 'auto', fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)' }}>{t('market.dataNotice')}</span>}
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

/** 종목 리스트 래퍼 — 모바일 카드 다이어트(플랫: 행 hover 가 구분 담당) / 데스크톱 Card(padding 6). */
function ListWrap({ mobile, children }: { mobile: boolean; children: React.ReactNode }) {
  if (mobile) return <div>{children}</div>
  return <Card style={{ padding: 6 }}>{children}</Card>
}

function HoldingsEmpty({ mobile = false }: { mobile?: boolean }) {
  const { t } = useTranslation('stocks')
  const body = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
      <div style={{ fontSize: 'var(--text-body-md)', fontWeight: 700, color: 'var(--fg-primary)' }}>{t('connect.title')}</div>
      <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--fg-tertiary)' }}>{t('connect.holdingsDesc')}</div>
      <Button variant="outline" size="sm" style={{ marginTop: 8 }} asChild>
        <Link to="/desk/settings">{t('connect.action')}</Link>
      </Button>
    </div>
  )
  // 모바일 카드 다이어트 — 빈 상태도 배경 위 플랫.
  if (mobile) return <div style={{ padding: '32px 20px' }}>{body}</div>
  return <Card style={{ padding: '32px 20px' }}>{body}</Card>
}

function PortfolioDonut({ holdings }: { holdings: TossHoldingsItem[] }) {
  const { t } = useTranslation('stocks')
  const rows = holdings
    .map((h, i) => ({ name: h.name || h.symbol, value: num(h.marketValue.amount), color: DONUT_PALETTE[i % DONUT_PALETTE.length]! }))
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

// ---- 발견(디스커버리) 랭킹 — 토스 rankings 실데이터 ---------------------------

function RankRow({ item, name, index, active, onPick }: { item: TossRankingItem; name: string | undefined; index: number; active: boolean; onPick: (symbol: string) => void }) {
  const country = /^[A-Za-z]/.test(item.symbol) ? 'US' : 'KR'
  const last = num(item.price.lastPrice)
  const changePct = item.price.changeRate != null ? num(item.price.changeRate) * 100 : null
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span className="num" style={{ width: 22, textAlign: 'center', flexShrink: 0, fontSize: 'var(--text-label-sm)', fontWeight: 700, color: index < 3 ? 'var(--fg-brand)' : 'var(--fg-tertiary)' }}>
        {item.rank}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <StockRow
          stock={{ symbol: item.symbol, name: name ?? item.symbol, countryCode: country, currency: item.currency }}
          active={active}
          onClick={() => onPick(item.symbol)}
          price={last > 0 ? last : null}
          changePct={changePct}
        />
      </div>
    </div>
  )
}

function DiscoverPanel({ onPick, selected, mobile = false }: { onPick: (t: string) => void; selected: string | null; mobile?: boolean }) {
  const { t } = useTranslation('stocks')
  const [market, setMarket] = useState<'KR' | 'US'>('KR')
  const [tab, setTab] = useState<'gainers' | 'losers' | 'volume'>('gainers')
  // TOP_GAINERS/LOSERS 는 realtime 미지원 → 1d, 거래량은 실시간.
  const type = tab === 'gainers' ? 'TOP_GAINERS' : tab === 'losers' ? 'TOP_LOSERS' : 'MARKET_TRADING_VOLUME'
  const duration = tab === 'volume' ? 'realtime' : '1d'
  const q = useTossRankings(type, market, duration, { count: 10 })
  const rankings = q.data?.rankings ?? []
  // 랭킹 응답엔 종목명이 없어 토스 종목정보로 배치 조회한다.
  const infoQ = useTossStockInfo(rankings.map(r => r.symbol))
  const nameOf = useMemo(() => {
    const map = new Map<string, string>()
    for (const i of infoQ.data ?? []) map.set(i.symbol, i.name)
    return map
  }, [infoQ.data])

  const rows = rankings.map((r, i) => (
    <RankRow key={`${r.symbol}`} item={r} name={nameOf.get(r.symbol)} index={i} active={selected === r.symbol} onPick={onPick} />
  ))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Tabs value={tab} onValueChange={v => setTab(v as 'gainers' | 'losers' | 'volume')}>
          <TabsList variant="pill" size="sm">
            <TabsTrigger variant="pill" value="gainers">{t('discover.gainers')}</TabsTrigger>
            <TabsTrigger variant="pill" value="losers">{t('discover.losers')}</TabsTrigger>
            <TabsTrigger variant="pill" value="volume">{t('discover.volume')}</TabsTrigger>
          </TabsList>
        </Tabs>
        <div style={{ marginLeft: 'auto' }}>
          <Tabs value={market} onValueChange={v => setMarket(v as 'KR' | 'US')}>
            <TabsList variant="pill" size="sm">
              <TabsTrigger variant="pill" value="KR">{t('market.krShort')}</TabsTrigger>
              <TabsTrigger variant="pill" value="US">{t('market.usShort')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      {q.isLoading ? (
        <QuotesEmpty msg={t('discover.loading')} />
      ) : rows.length === 0 ? (
        <QuotesEmpty msg={t('discover.empty')} />
      ) : mobile ? (
        <div>{rows}</div>
      ) : (
        <Card style={{ padding: 6 }}>{rows}</Card>
      )}
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

function StockInfoCard({ symbol, currency, info, lastPrice, fxRate }: { symbol: string; currency: string; info: TossStockInfo | undefined; lastPrice: number | null; fxRate: number | null }) {
  const { t } = useTranslation('stocks')
  const limitsQ = useTossPriceLimits(symbol)
  const limits = limitsQ.data
  const shares = num(info?.sharesOutstanding)
  const isUs = currency === 'USD'
  const isKr = currency === 'KRW'
  // 시가총액 = 현재가 × 발행주식수 (USD 는 환율 환산). 시세가 없으면 표시하지 않는다.
  const priceInKrw = lastPrice == null ? null : isUs ? (fxRate == null ? null : lastPrice * fxRate) : isKr ? lastPrice : null
  const mcKRW = priceInKrw != null && shares > 0 ? priceInKrw * shares : null
  const upper = limits?.upperLimitPrice ? num(limits.upperLimitPrice) : null
  const lower = limits?.lowerLimitPrice ? num(limits.lowerLimitPrice) : null
  const rows: Array<{ k: string; v: string; c?: string }> = [
    { k: t('info.market'), v: info ? info.market : isUs ? t('market.usShort') : t('market.krShort') },
    { k: t('info.securityType'), v: info?.securityType === 'ETF' ? 'ETF' : t('info.stock') },
    { k: t('info.currency'), v: info?.currency ?? currency },
    ...(mcKRW != null ? [{ k: t('info.marketCap'), v: fmtCapKRW(mcKRW) }] : []),
    ...(isKr && upper != null ? [{ k: t('info.upperLimit'), v: money(upper), c: 'var(--status-danger-fg)' }] : []),
    ...(isKr && lower != null ? [{ k: t('info.lowerLimit'), v: money(lower), c: 'var(--fg-brand)' }] : []),
    ...(info?.listDate ? [{ k: t('info.listDate'), v: info.listDate }] : []),
    ...(shares > 0 ? [{ k: t('info.sharesOutstanding'), v: fmtShares(shares) }] : []),
    {
      k: t('info.tradingStatus'),
      // 거래정지는 토스 status(분류성 값)가 아니라 KRX 거래정지 플래그로 판정.
      v: info?.koreanMarketDetail?.krxTradingSuspended ? t('info.suspended') : t('info.normal'),
      c: info?.koreanMarketDetail?.krxTradingSuspended ? 'var(--status-danger-fg)' : 'var(--status-success-fg)',
    },
  ]
  return (
    <Card style={{ padding: 16 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-secondary)', marginBottom: 12 }}>{t('info.title')}</div>
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

function StockDetailBody({ ticker, holding, watched, onToggleWatch, mobile }: { ticker: string; holding: TossHoldingsItem | null; watched: boolean; onToggleWatch: (marketCode?: string) => void; mobile: boolean }) {
  const { t } = useTranslation('stocks')
  const [range, setRange] = useState<Range>('1D')
  // 종목 정체성: 마스터(이름·시장·통화) + 토스 종목정보 병행. 마스터에 없는 심볼(보유 이관 등)은 토스 정보로 폴백.
  const masterQ = useStockBySymbol(ticker)
  const infoQ = useTossStockInfo([ticker])
  const pricesQ = useTossPrices([ticker])
  const prevCloseQ = usePrevClose(ticker)
  const fxQ = useTossExchangeRate()
  const warningsQ = useTossStockWarnings(ticker)

  const master = masterQ.data ?? null
  const info = infoQ.data?.[0]
  const name = master?.nameKr ?? info?.name ?? holding?.name ?? ticker
  const currency = info?.currency ?? master?.currency ?? holding?.currency ?? 'KRW'
  const countryCode = master?.countryCode ?? (currency === 'USD' ? 'US' : 'KR')
  const isUs = currency === 'USD'
  const warnings = warningsQ.data ?? []

  const lastRaw = pricesQ.data?.[0]?.lastPrice
  const last = lastRaw != null && Number.isFinite(Number.parseFloat(lastRaw)) ? Number.parseFloat(lastRaw) : null
  const fxRate = fxQ.data ? num(fxQ.data.rate) : null
  // 등락률 = 토스 현재가 vs 전일 종가(일봉). 시세 미지원 종목은 배지를 숨긴다.
  const changePct = changePctOf(last, prevCloseQ.data)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 헤더: 종목명·관심 토글 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <StockBadge name={name} symbol={ticker} countryCode={countryCode} size={46} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--fg-primary)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name}
          </div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span>{ticker}</span>
            <Badge variant="secondary">
              {master ? t(`market.${master.marketCode}`, { defaultValue: master.marketCode }) : info?.market ?? ''}
            </Badge>
            <span>·</span>
            <span>
              {info?.securityType === 'ETF' || master?.securityType === 'ETF'
                ? 'ETF'
                : t(`securityType.${master?.securityType ?? 'STOCK'}`, { defaultValue: t('info.stock') })}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onToggleWatch(master?.marketCode)}
          title={watched ? t('watch.remove') : t('watch.add')}
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

      {/* 현재가 (토스 prices — KR/US 만 제공. 그 외 시장은 미지원 안내) */}
      <div>
        <div className="num" style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-primary)' }}>
          {last != null ? fmtByCurrency(last, currency) : '—'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
          {changePct != null && <PctBadge pct={changePct} size={14} />}
          {isUs && last != null && fxRate != null && (
            <span className="num" style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>≈ {money(Math.round(last * fxRate))}</span>
          )}
          {last == null && !pricesQ.isLoading && (
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>{t('detail.priceUnavailable')}</span>
          )}
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
              {t(`warning.${w.warningType}`, { defaultValue: w.warningType })}
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
                  {t(RANGE_LABEL_KEY[r])}
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
            [t('holding.marketValue'), <MaskAmount card="stocks.detail" key="ev">{money(ev)}</MaskAmount>, 'var(--fg-primary)'],
            [t('holding.profitLoss'), <MaskAmount card="stocks.detail" key="pnl">{`${pnl >= 0 ? '+' : '−'}${money(pnl, { abs: true })}`}</MaskAmount>, trendColor(pnl)],
            [t('holding.quantity'), t('holding.sharesUnit', { count: holding.quantity }), 'var(--fg-primary)'],
            [t('holding.returnRate'), `${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%`, trendColor(pnl)],
            [t('holding.dailyPnl'), <MaskAmount card="stocks.detail" key="day">{`${dayPnl >= 0 ? '+' : '−'}${money(dayPnl, { abs: true })}`}</MaskAmount>, trendColor(dayPnl)],
            [t('holding.avgPrice'), heldUs ? `$${avg.toFixed(2)}` : money(Math.round(avg)), 'var(--fg-secondary)'],
            [t('holding.purchaseAmount'), <MaskAmount card="stocks.detail" key="cost">{money(purchase)}</MaskAmount>, 'var(--fg-secondary)'],
            [t('holding.feesTax'), money(fees), 'var(--fg-secondary)'],
            [t('holding.sellable'), t('holding.sharesUnit', { count: holding.quantity }), 'var(--fg-secondary)'],
          ]
          return (
            <Card style={{ padding: 16 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-secondary)', marginBottom: 12 }}>{t('holding.title')}</div>
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
        <QuotesCard symbol={ticker} currency={currency} lastPrice={last} changePct={changePct ?? 0} />
        <StockInfoCard symbol={ticker} currency={currency} info={info} lastPrice={last} fxRate={fxRate} />
      </div>

      {/* 일별 시세 */}
      <DailyQuoteTable symbol={ticker} currency={currency} />

      {/* 매매 (모의) — 매도=primary(파랑), 매수=destructive(빨강) — 국내 통념 */}
      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="default" size="lg" style={{ flex: 1 }} onClick={() => toast(t('trade.sellToast', { name }))}>
          {t('trade.sell')}
        </Button>
        <Button variant="destructive" size="lg" style={{ flex: 1 }} onClick={() => toast(t('trade.buyToast', { name }))}>
          {t('trade.buy')}
        </Button>
      </div>

      {/* 수수료 안내 — 토스증권 Open API 기준 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--bg-sunken)', borderRadius: 'var(--radius-md)' }}>
        <Info size={14} color="var(--fg-tertiary)" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-secondary)', lineHeight: 1.45 }}>
          {isUs ? t('fee.us') : t('fee.kr')}
        </span>
      </div>

      <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', textAlign: 'center', lineHeight: 1.5 }}>
        {t('disclaimer.line1')}
        <br />
        {t('disclaimer.line2')}
      </div>
    </div>
  )
}

// ---- 종목 검색 다이얼로그 (서버 stock_master — 국내 + 해외 6개국) -------------

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

function StockSearchDialog({ mobile, onPick, onClose }: { mobile: boolean; onPick: (ticker: string) => void; onClose: () => void }) {
  const { t } = useTranslation('stocks')
  const [q, setQ] = useState('')
  const debounced = useDebounced(q.trim(), 300)
  const { data: results = [], isFetching } = useStockSearch(debounced, 20)
  const searched = debounced.length > 0 && !isFetching && q.trim() === debounced
  return (
    <ModalShell title={t('search.label')} onClose={onClose} mobile={mobile} mobileMinHeight="85dvh">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-tertiary)', pointerEvents: 'none' }} />
          <Input search autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder={t('search.placeholder')} className="w-full pl-9" />
        </div>
        <div style={{ maxHeight: mobile ? undefined : '56vh', overflowY: 'auto' }}>
          {q.trim().length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-label-sm)' }}>{t('search.hint')}</div>
          ) : searched && results.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-label-sm)' }}>{t('search.noResults', { query: q })}</div>
          ) : (
            results.map((s: StockMasterItem) => (
              <StockRow
                key={`${s.marketCode}:${s.symbol}`}
                stock={{ symbol: s.symbol, name: s.nameKr, countryCode: s.countryCode, currency: s.currency }}
                sub={`${t(`market.${s.marketCode}`, { defaultValue: s.marketCode })} · ${t(`securityType.${s.securityType}`, { defaultValue: s.securityType })}`}
                right={<span />}
                onClick={() => {
                  onPick(s.symbol)
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

// ---- 관심목록 그룹 편집 다이얼로그 ------------------------------------------

function WatchGroupDialog({ mobile, group, onClose }: { mobile: boolean; group: WatchGroup | null; onClose: () => void }) {
  const { t } = useTranslation('stocks')
  const { t: tc } = useTranslation('common')
  const [name, setName] = useState(group?.groupName ?? '')
  const createMut = useCreateWatchGroup()
  const renameMut = useRenameWatchGroup()
  const deleteMut = useDeleteWatchGroup()
  const busy = createMut.isPending || renameMut.isPending || deleteMut.isPending
  const canSave = name.trim().length > 0 && !busy

  const save = () => {
    const groupName = name.trim()
    if (!groupName) return
    if (group) {
      renameMut.mutate({ groupId: group.rowId, groupName }, {
        onSuccess: onClose,
        onError: () => toast.error(t('watch.groupSaveFail')),
      })
    } else {
      createMut.mutate(groupName, {
        onSuccess: onClose,
        onError: () => toast.error(t('watch.groupSaveFail')),
      })
    }
  }

  return (
    <ModalShell title={group ? t('watch.groupRename') : t('watch.groupAdd')} onClose={onClose} mobile={mobile}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('watch.groupNamePlaceholder')}
          onKeyDown={e => {
            if (e.key === 'Enter' && canSave) save()
          }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="sm" disabled={!canSave} onClick={save} style={{ flex: 1 }}>
            {tc('save')}
          </Button>
          {group && (
            <Button
              variant="destructive"
              size="sm"
              disabled={busy}
              onClick={() => {
                if (!window.confirm(t('watch.groupDeleteConfirm'))) return
                deleteMut.mutate(group.rowId, {
                  onSuccess: onClose,
                  onError: () => toast.error(t('watch.groupSaveFail')),
                })
              }}
            >
              {t('watch.groupDelete')}
            </Button>
          )}
        </div>
      </div>
    </ModalShell>
  )
}

// ---- 관심목록 행 (시세 + 전일대비 — 심볼 단위 조회) ---------------------------

function WatchRowItem({ symbol, name, countryCode, currency, sub, priceMap, active, onClick }: { symbol: string; name: string; countryCode: string; currency: string; sub: string; priceMap: Map<string, number>; active: boolean; onClick: () => void }) {
  const prevCloseQ = usePrevClose(symbol)
  const last = priceMap.get(symbol) ?? null
  const changePct = changePctOf(last, prevCloseQ.data)
  return (
    <StockRow
      stock={{ symbol, name, countryCode, currency }}
      sub={sub}
      price={last}
      changePct={changePct}
      active={active}
      onClick={onClick}
    />
  )
}

// ---- 메인 화면 -----------------------------------------------------------

export function StocksPage() {
  const { t } = useTranslation('stocks')
  const { mobile } = useOutletContext<OutletCtx>()
  // 개인키 연결 상태 — 미연결 시 페이지 전체를 '연결 유도'로 게이트.
  const { data: credential, isLoading: credLoading } = useTossCredentialStatus()
  const connected = credential?.connected ?? false
  const [selected, setSelected] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [seg, setSeg] = useState<'holdings' | 'watch' | 'discover'>('holdings')

  // 관심목록 — 서버 영속(stock-watch). 그룹 탭 + 별 토글.
  const watchQ = useWatchGroups()
  const watchGroups = useMemo(() => watchQ.data ?? [], [watchQ.data])
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null)
  const [groupDialog, setGroupDialog] = useState<{ open: boolean; group: WatchGroup | null }>({ open: false, group: null })
  useEffect(() => {
    if (watchGroups.length === 0) {
      setActiveGroupId(null)
      return
    }
    if (activeGroupId == null || !watchGroups.some(g => g.rowId === activeGroupId)) {
      setActiveGroupId(watchGroups[0]!.rowId)
    }
  }, [watchGroups, activeGroupId])
  const createGroupMut = useCreateWatchGroup()
  const addItemMut = useAddWatchItem()
  const removeItemMut = useRemoveWatchItem()

  // 보유자산 — 키 연결 시 실데이터(/toss/accounts→/toss/holdings), 미연결 시 빈 상태.
  const { data: accounts } = useTossAccounts()
  const accountSeq = accounts?.[0]?.accountSeq ?? null
  const { data: holdings } = useTossHoldings(accountSeq)
  const holdingItems = useMemo(
    () => (holdings ? [...holdings.items].sort((a, b) => num(b.marketValue.amount) - num(a.marketValue.amount)) : []),
    [holdings],
  )
  // 환율 (요약 카드 + 상세 원화 환산)
  const fxQ = useTossExchangeRate()

  // 데스크톱: 기본 선택 = 첫 보유 종목
  useEffect(() => {
    if (!mobile && !selected && holdingItems.length > 0) setSelected(holdingItems[0]!.symbol)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobile, holdingItems.length])

  const watchedSymbols = useMemo(() => new Set(watchGroups.flatMap(g => g.items.map(i => i.symbol))), [watchGroups])
  const isWatched = (sym: string) => watchedSymbols.has(sym)
  const toggleWatch = (sym: string, marketCode?: string) => {
    const entries = findWatchEntries(watchGroups, sym)
    if (entries.length > 0) {
      // 별 해제 = 모든 그룹에서 제거 (기존 UX 유지)
      for (const e of entries) removeItemMut.mutate(e.item.rowId)
      return
    }
    if (watchGroups.length === 0) {
      // 첫 관심 등록이면 기본 그룹부터 만든다.
      createGroupMut.mutate(t('watch.defaultGroupName'), {
        onSuccess: g => addItemMut.mutate({ groupId: g.rowId, symbol: sym, marketCode }),
        onError: () => toast.error(t('watch.addFail')),
      })
      return
    }
    const groupId = activeGroupId ?? watchGroups[0]!.rowId
    addItemMut.mutate({ groupId, symbol: sym, marketCode }, { onError: () => toast.error(t('watch.addFail')) })
  }

  // 요약 (서버 계산값)
  const totalEval = holdings ? num(holdings.marketValue.amount.krw) : 0
  const totalCost = holdings ? num(holdings.totalPurchaseAmount.krw) : 0
  const totalPnl = holdings ? num(holdings.profitLoss.amount.krw) : 0
  const totalPnlPct = holdings ? num(holdings.profitLoss.rate) : 0
  const curGroup = watchGroups.find(g => g.rowId === activeGroupId) ?? watchGroups[0] ?? null
  const selHolding = selected ? holdingItems.find(h => h.symbol === selected) ?? null : null
  const fxRate = fxQ.data ? num(fxQ.data.rate) : null

  // 관심 탭 시세 — 현재 그룹 심볼 배치 1콜 (10초 폴링은 useTossPrices 공통)
  const watchSymbols = useMemo(() => (curGroup ? curGroup.items.map(i => i.symbol) : []), [curGroup])
  const watchPricesQ = useTossPrices(seg === 'watch' ? watchSymbols : [])
  const watchPriceMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of watchPricesQ.data ?? []) {
      const v = Number.parseFloat(p.lastPrice)
      if (Number.isFinite(v)) map.set(p.symbol, v)
    }
    return map
  }, [watchPricesQ.data])

  // 모바일 = keep 카드(raised + shadow-lg) — 카드 다이어트에서 유지되는 투자 요약 (design StocksScreen).
  const summary = !holdings ? (
    <Card variant={mobile ? 'raised' : undefined} style={{ padding: mobile ? 18 : 22 }}>
      <div style={{ fontSize: 12.5, color: 'var(--fg-tertiary)', fontWeight: 600 }}>{t('summary.title')}</div>
      <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--fg-tertiary)', marginTop: 8 }}>{t('summary.connectPrompt')}</div>
    </Card>
  ) : (
    <Card variant={mobile ? 'raised' : undefined} style={{ padding: mobile ? 18 : 22 }}>
      <div style={{ fontSize: 12.5, color: 'var(--fg-tertiary)', fontWeight: 600 }}>{t('summary.title')}</div>
      <div className="num" style={{ fontSize: mobile ? 28 : 32, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-primary)', marginTop: 4 }}>
        <MaskAmount card="stocks.holdings">{KRW(totalEval)}</MaskAmount>원
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
        <span className="num" style={{ fontSize: 'var(--text-body-sm)', fontWeight: 700, color: trendColor(totalPnl), whiteSpace: 'nowrap' }}>
          <MaskAmount card="stocks.holdings">{`${totalPnl >= 0 ? '+' : '−'}${money(totalPnl, { abs: true })}`}</MaskAmount>
        </span>
        <PctBadge pct={totalPnlPct} size={13} />
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
        {(
          [
            [t('holding.purchaseAmount'), <MaskAmount card="stocks.holdings" key="c">{money(totalCost)}</MaskAmount>],
            [t('summary.holdingsCount'), t('unit.count', { count: holdingItems.length })],
            [t('summary.fxRate'), fxRate != null ? `₩${Math.round(fxRate).toLocaleString()}` : '—'],
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
        <Input search readOnly placeholder={t('search.label')} className="w-full pl-9" style={{ cursor: 'pointer' }} onClick={() => setSearchOpen(true)} />
      </div>

      <Tabs value={seg} onValueChange={v => setSeg(v as 'holdings' | 'watch' | 'discover')}>
        <TabsList variant="pill" size="sm">
          <TabsTrigger variant="pill" value="holdings">{t('segments.holdings', { count: holdingItems.length })}</TabsTrigger>
          <TabsTrigger variant="pill" value="watch">{t('segments.watch', { count: watchedSymbols.size })}</TabsTrigger>
          <TabsTrigger variant="pill" value="discover">{t('segments.discover')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {seg === 'discover' ? (
        <DiscoverPanel onPick={setSelected} selected={selected} mobile={mobile} />
      ) : seg === 'holdings' ? (
        !holdings ? (
          <HoldingsEmpty mobile={mobile} />
        ) : holdingItems.length === 0 ? (
          <ListWrap mobile={mobile}>
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-label-sm)' }}>{t('holdings.empty')}</div>
          </ListWrap>
        ) : (
          <ListWrap mobile={mobile}>
            {holdingItems.map(h => {
              const ev = num(h.marketValue.amount)
              const pnl = num(h.profitLoss.amount)
              const pct = num(h.profitLoss.rate)
              const heldUs = h.marketCountry.toUpperCase() === 'US' || h.currency.toUpperCase() === 'USD'
              return (
                <StockRow
                  key={h.symbol}
                  stock={{ symbol: h.symbol, name: h.name || h.symbol, countryCode: heldUs ? 'US' : 'KR', currency: h.currency }}
                  active={selected === h.symbol}
                  onClick={() => setSelected(h.symbol)}
                  sub={t('holding.sharesHeld', { count: h.quantity })}
                  right={
                    <>
                      <div className="num" style={{ fontSize: 'var(--text-body-sm)', fontWeight: 700, color: 'var(--fg-primary)' }}>
                        <MaskAmount card="stocks.holdings">{money(ev)}</MaskAmount>
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
          </ListWrap>
        )
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {watchGroups.length > 0 && (
            <Tabs value={String(activeGroupId ?? '')} onValueChange={val => val && setActiveGroupId(Number(val))}>
              <TabsList variant="pill" size="sm">
                {watchGroups.map(g => (
                  <TabsTrigger key={g.rowId} variant="pill" value={String(g.rowId)}>
                    {g.groupName} <span style={{ opacity: 0.7 }}>{g.items.length}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              {curGroup && (
                <Button variant="ghost" size="icon" title={t('watch.groupRename')} onClick={() => setGroupDialog({ open: true, group: curGroup })}>
                  <Pencil size={14} />
                </Button>
              )}
              <Button variant="ghost" size="icon" title={t('watch.groupAdd')} onClick={() => setGroupDialog({ open: true, group: null })}>
                <Plus size={15} />
              </Button>
            </div>
          </div>
          <ListWrap mobile={mobile}>
            {!curGroup || curGroup.items.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-label-sm)' }}>{t('watch.empty')}</div>
            ) : (
              curGroup.items.map(i => (
                <WatchRowItem
                  key={i.rowId}
                  symbol={i.symbol}
                  name={i.nameKr}
                  countryCode={i.countryCode}
                  currency={i.currency}
                  sub={t(`market.${i.marketCode}`, { defaultValue: i.marketCode })}
                  priceMap={watchPriceMap}
                  active={selected === i.symbol}
                  onClick={() => setSelected(i.symbol)}
                />
              ))
            )}
          </ListWrap>
        </>
      )}
    </div>
  )

  // ---- 개인키 미연결: 전 화면 연결 유도 ----
  if (!credLoading && !connected) {
    const gateBody = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
        <div style={{ fontSize: 'var(--text-body-md)', fontWeight: 700, color: 'var(--fg-primary)' }}>{t('connect.title')}</div>
        <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--fg-tertiary)', lineHeight: 1.5 }}>
          {t('connect.gateDesc')}
        </div>
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

  const dialogs = (
    <>
      {searchOpen && <StockSearchDialog mobile={mobile} onPick={sym => setSelected(sym)} onClose={() => setSearchOpen(false)} />}
      {groupDialog.open && <WatchGroupDialog mobile={mobile} group={groupDialog.group} onClose={() => setGroupDialog({ open: false, group: null })} />}
    </>
  )

  // ---- 모바일: 풀스크린(← 헤더) + 스택 + 상세 시트 ----
  if (mobile) {
    return (
      <>
        <MobileBackHeader title={t('nav.title')} />
        <div style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <MarketStatusBar mobile />
          {summary}
          {listPanel}
          {selected && (
            <ModalShell title={t('detail.sheetTitle')} onClose={() => setSelected(null)} mobile mobileMinHeight="88dvh">
              <StockDetailBody ticker={selected} holding={selHolding} watched={isWatched(selected)} onToggleWatch={mc => toggleWatch(selected, mc)} mobile />
            </ModalShell>
          )}
          {dialogs}
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
            <StockDetailBody ticker={selected} holding={selHolding} watched={isWatched(selected)} onToggleWatch={mc => toggleWatch(selected, mc)} mobile={false} />
          ) : (
            <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--fg-tertiary)' }}>
              <LineChart size={40} />
              <div style={{ marginTop: 12, fontSize: 'var(--text-body-sm)' }}>{t('detail.selectPrompt')}</div>
            </div>
          )}
        </Card>
      </div>
      {dialogs}
    </div>
  )
}
