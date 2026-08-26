import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useOutletContext } from 'react-router-dom'
import { Info, LineChart, Search, Unplug } from 'lucide-react'
import { MaskAmount } from '@/shared/lib/porest/hide-amounts'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Skeleton } from '@/shared/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { MobileBackHeader } from '@/shared/ui/porest/mobile-back-header'
import { fmtByCurrency, num, trendColor } from '@/features/stock/lib/format'
import { useNamuHoldings } from '@/features/stock/model/useNamu'
import { useSecuritiesPrices } from '@/features/stock/model/useSecuritiesPrices'
import { useStockBySymbol } from '@/features/stock/model/useStockMaster'
import { useWatchlist } from '@/features/stock/model/useWatchlist'
import { ListWrap, PctBadge, PanelEmpty, StockBadge, StockRow, WatchStar } from '@/features/stock/ui/stock-row'
import { StockChartCard } from '@/features/stock/ui/stock-chart-card'
import { StockSearchDialog, WatchGroupDialog } from '@/features/stock/ui/stock-dialogs'
import { PortfolioDonut } from '@/features/stock/ui/portfolio-donut'
import { WatchlistPanel, type RowQuote } from '@/features/stock/ui/watchlist-panel'
import type { NamuHoldingItem } from '@/features/stock/api/namuApi'
import type { WatchGroup } from '@/features/stock/api/stockApi'

interface OutletCtx {
  mobile: boolean
}

/**
 * 나무증권 본문 — 토스 화면과 **같은 골격**(보유·관심·검색 → 상세 + 차트)이다.
 *
 * 겹치는 조각(종목 행·별·검색·그룹 편집·도넛·차트)은 `features/stock/ui` 에서 가져다 쓴다.
 * 예전엔 나무가 보유 요약과 시세만 보여줬는데, 그걸 토스에서 베껴 채우면 두 벌이 각자 늙는다.
 *
 * **증권사마다 다른 것만 여기 남는다.**
 * - 국내/해외가 엔드포인트로 갈린다 → 통화 탭(KRW·USD). 토스엔 이 축이 없다
 * - 나무 해외는 **미국(USD)만** 된다. 다른 통화는 서버가 400(`SEC_012`) 을 낸다 —
 *   그래서 탭을 그 둘로 못 박고 UI 가 다른 통화를 물을 수 없게 한다
 * - 랭킹·호가·체결·시장지표가 없다(나무 API 에 없다). 대신 체결추이·투자자별·채권·금현물이
 *   있으므로 나무 고유 조회는 이 파일에 쌓는다
 */
export function NamuStocksPage({ header }: { header?: React.ReactNode }) {
  const { t } = useTranslation('stocks')
  const { mobile } = useOutletContext<OutletCtx>()
  // 국내·해외는 나무 쪽 엔드포인트가 달라 한 번에 못 받는다 — 사용자가 고른다.
  const [currency, setCurrency] = useState<'KRW' | 'USD'>('KRW')
  const [selected, setSelected] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [seg, setSeg] = useState<'holdings' | 'watch'>('holdings')
  const [groupDialog, setGroupDialog] = useState<{ open: boolean; group: WatchGroup | null }>({ open: false, group: null })

  const watchlist = useWatchlist()
  const holdingsQ = useNamuHoldings(currency)
  const holdings = holdingsQ.data

  const holdingItems = useMemo(
    () => (holdings ? [...holdings.items].sort((a, b) => num(b.evalAmount) - num(a.evalAmount)) : []),
    [holdings],
  )

  // 통화 탭을 바꾸면 반대쪽 통화의 종목이 상세에 남는다 — 선택을 접는다.
  useEffect(() => {
    setSelected(null)
  }, [currency])

  // 데스크톱: 기본 선택 = 첫 보유 종목 (토스와 같은 규칙)
  useEffect(() => {
    if (!mobile && !selected && holdingItems.length > 0) setSelected(holdingItems[0]!.symbol)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobile, holdingItems.length])

  // ---- 시세: 나무 유량 제한을 여기서 다룬다 --------------------------------
  //
  // 나무엔 **다건 시세 API 가 없다** — 종목마다 1콜이라 화면에서 종목 수만큼 부르면 유량
  // 제한에 걸린다. 그래서 두 가지를 지킨다.
  //
  // ① 보유 목록은 **추가 호출을 하지 않는다.** 잔고 응답에 종목별 `currentPrice` 와
  //    `evalAmount` 가 이미 실려 온다(`NamuHoldingItem`). 행마다 시세를 다시 부르면
  //    같은 값을 얻으려고 N 콜을 더 내는 셈이다.
  // ② 관심목록만 시세가 필요하고, 그건 **서버 대리 조회 다건 경로**(`/v1/securities/prices`)로
  //    한 번에 묻는다. 서버가 상한(50종목)·캐시(20초)·시간예산(4초)을 쥐고 있다.
  //    주기는 캐시 TTL 보다 길게 잡아 한 주기에 상류 호출이 한 번만 나가게 한다.
  const watchSymbols = useMemo(
    () => (seg === 'watch' && watchlist.activeGroup ? watchlist.activeGroup.items.map(i => i.symbol) : []),
    [seg, watchlist.activeGroup],
  )
  const watchPricesQ = useSecuritiesPrices(watchSymbols, WATCH_POLL_MS)
  const watchQuotes = useMemo(() => {
    const map = new Map<string, RowQuote>()
    for (const q of watchPricesQ.data ?? []) {
      // 전일 종가는 나무가 시세 응답에 실어 준다 — 등락률을 캔들 없이 낸다.
      const changePct = q.previousClose != null && q.previousClose > 0 ? ((q.price - q.previousClose) / q.previousClose) * 100 : null
      map.set(q.symbol, { price: Number.isFinite(q.price) ? q.price : null, changePct })
    }
    return map
  }, [watchPricesQ.data])

  const selHolding = selected ? holdingItems.find(h => h.symbol === selected) ?? null : null

  const summary = <NamuSummary holdings={holdings} loading={holdingsQ.isLoading} error={holdingsQ.isError} mobile={mobile} count={holdingItems.length} />

  const currencyTabs = (
    <Tabs value={currency} onValueChange={v => setCurrency(v as 'KRW' | 'USD')}>
      <TabsList style={{ width: '100%' }}>
        <TabsTrigger value="KRW" style={{ flex: 1 }}>
          {t('namu.tabDomestic')}
        </TabsTrigger>
        <TabsTrigger value="USD" style={{ flex: 1 }}>
          {t('namu.tabOverseas')}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )

  const listPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-tertiary)', pointerEvents: 'none' }} />
        <Input search readOnly placeholder={t('search.label')} className="w-full pl-9" style={{ cursor: 'pointer' }} onClick={() => setSearchOpen(true)} />
      </div>

      <Tabs value={seg} onValueChange={v => setSeg(v as 'holdings' | 'watch')}>
        <TabsList variant="pill" size="sm">
          <TabsTrigger variant="pill" value="holdings">{t('segments.holdings', { count: holdingItems.length })}</TabsTrigger>
          <TabsTrigger variant="pill" value="watch">{t('segments.watch', { count: watchlist.watchedSymbols.size })}</TabsTrigger>
        </TabsList>
      </Tabs>

      {seg === 'holdings' ? (
        holdingsQ.isLoading ? (
          <Skeleton style={{ height: 140, borderRadius: 'var(--radius-lg)' }} />
        ) : holdingsQ.isError || !holdings ? (
          // 계좌가 없거나 조회가 막히면 화면을 비우지 않고 이유를 보여준다.
          <ListWrap mobile={mobile}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '32px 20px', color: 'var(--fg-tertiary)', fontSize: 'var(--text-label-sm)' }}>
              <Unplug size={16} />
              {t('namu.holdingsError')}
            </div>
          </ListWrap>
        ) : holdingItems.length === 0 ? (
          <ListWrap mobile={mobile}>
            <PanelEmpty msg={t('namu.holdingsEmpty')} />
          </ListWrap>
        ) : (
          <ListWrap mobile={mobile}>
            {holdingItems.map(h => (
              <NamuHoldingRow
                key={h.symbol}
                item={h}
                currency={holdings.currency}
                mobile={mobile}
                active={selected === h.symbol}
                onClick={() => setSelected(h.symbol)}
              />
            ))}
          </ListWrap>
        )
      ) : (
        <WatchlistPanel
          watchlist={watchlist}
          mobile={mobile}
          selected={selected}
          onSelect={setSelected}
          onEditGroup={group => setGroupDialog({ open: true, group })}
          priceOf={sym => watchQuotes.get(sym) ?? { price: null, changePct: null }}
        />
      )}
    </div>
  )

  const detail = selected ? (
    <NamuStockDetail
      symbol={selected}
      holding={selHolding}
      holdingsCurrency={holdings?.currency ?? currency}
      watched={watchlist.isWatched(selected)}
      onToggleWatch={mc => watchlist.toggleWatch(selected, mc)}
      mobile={mobile}
    />
  ) : null

  const dialogs = (
    <>
      {searchOpen && (
        <StockSearchDialog mobile={mobile} onPick={item => setSelected(item.symbol)} onClose={() => setSearchOpen(false)} />
      )}
      {groupDialog.open && (
        <WatchGroupDialog mobile={mobile} group={groupDialog.group} onClose={() => setGroupDialog({ open: false, group: null })} />
      )}
    </>
  )

  // ---- 모바일: 풀스크린(← 헤더) + 스택 + 상세 시트 ----
  if (mobile) {
    return (
      <>
        <MobileBackHeader title={t('nav.title')} />
        <div style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {header}
          {currencyTabs}
          {summary}
          {listPanel}
          {selected && (
            <ModalShell title={t('detail.sheetTitle')} onClose={() => setSelected(null)} mobile mobileMinHeight="88dvh">
              {detail}
            </ModalShell>
          )}
          {dialogs}
        </div>
      </>
    )
  }

  // ---- 데스크톱/태블릿: 2-pane (토스와 같은 골격) ----
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
        {header}
        {currencyTabs}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 400px) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {summary}
          {holdingItems.length > 0 && (
            <PortfolioDonut slices={holdingItems.map(h => ({ name: h.name || h.symbol, value: num(h.evalAmount) }))} />
          )}
          {listPanel}
        </div>
        <Card style={{ padding: 24 }}>
          {detail ?? (
            <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--fg-tertiary)' }}>
              <LineChart size={40} style={{ margin: '0 auto' }} />
              <div style={{ marginTop: 12, fontSize: 'var(--text-body-sm)' }}>{t('detail.selectPrompt')}</div>
            </div>
          )}
        </Card>
      </div>
      {dialogs}
    </div>
  )
}

/**
 * 관심목록 시세 폴링 주기. 서버 나무 시세 캐시 TTL(20초)보다 길게 잡는다 —
 * 짧게 잡으면 캐시에 맞는 헛 요청만 늘고 상류 호출은 안 줄어든다.
 */
const WATCH_POLL_MS = 30_000

// ---- 보유 요약 ------------------------------------------------------------

function NamuSummary({ holdings, loading, error, mobile, count }: { holdings: ReturnType<typeof useNamuHoldings>['data']; loading: boolean; error: boolean; mobile: boolean; count: number }) {
  const { t } = useTranslation('stocks')
  // 모바일 = keep 카드(raised + shadow-lg) — 카드 다이어트에서 유지되는 투자 요약.
  const cardProps = { variant: mobile ? ('raised' as const) : undefined, style: { padding: mobile ? 18 : 22 } }

  if (loading) return <Skeleton style={{ height: mobile ? 150 : 165, borderRadius: 'var(--radius-lg)' }} />

  if (error || !holdings) {
    return (
      <Card {...cardProps}>
        <div style={{ fontSize: 12.5, color: 'var(--fg-tertiary)', fontWeight: 600 }}>{t('summary.title')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, color: 'var(--fg-tertiary)', fontSize: 'var(--text-body-sm)' }}>
          <Unplug size={16} />
          {t('namu.holdingsError')}
        </div>
      </Card>
    )
  }

  const totalEval = num(holdings.totalEvalAmount)
  const totalPnl = num(holdings.totalProfitLoss)
  const rate = num(holdings.profitRate)
  const cur = holdings.currency

  return (
    <Card {...cardProps}>
      <div style={{ fontSize: 12.5, color: 'var(--fg-tertiary)', fontWeight: 600 }}>{t('summary.title')}</div>
      <div className="num" style={{ fontSize: mobile ? 28 : 32, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-primary)', marginTop: 4 }}>
        <MaskAmount card="stocks.holdings">{fmtByCurrency(totalEval, cur)}</MaskAmount>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
        <span className="num" style={{ fontSize: 'var(--text-body-sm)', fontWeight: 700, color: trendColor(totalPnl), whiteSpace: 'nowrap' }}>
          <MaskAmount card="stocks.holdings">{`${totalPnl >= 0 ? '+' : '−'}${fmtByCurrency(Math.abs(totalPnl), cur)}`}</MaskAmount>
        </span>
        <PctBadge pct={rate} size={13} />
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
        {(
          [
            [t('summary.holdingsCount'), t('unit.count', { count })],
            [t('info.currency'), cur],
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
}

// ---- 보유 종목 행 ---------------------------------------------------------

/**
 * 보유 행. **시세를 따로 안 부른다** — 잔고 응답의 `currentPrice`·`evalAmount` 를 그대로 쓴다.
 * 행마다 `useNamuPrice` 를 걸면 나무는 종목마다 1콜이라 목록을 여는 것만으로 유량 제한에 걸린다.
 */
function NamuHoldingRow({ item, currency, mobile, active, onClick }: { item: NamuHoldingItem; currency: string; mobile: boolean; active: boolean; onClick: () => void }) {
  const { t } = useTranslation('stocks')
  const ev = num(item.evalAmount)
  const pnl = num(item.profitLoss)
  const qty = num(item.quantity)
  const cost = ev - pnl
  const pct = cost > 0 ? (pnl / cost) * 100 : 0
  return (
    <StockRow
      mobile={mobile}
      stock={{ symbol: item.symbol, name: item.name || item.symbol, countryCode: currency === 'KRW' ? 'KR' : 'US', currency }}
      active={active}
      onClick={onClick}
      sub={t('holding.sharesHeld', { count: qty })}
      right={
        <>
          <div className="num" style={{ fontSize: 'var(--text-body-sm)', fontWeight: 700, color: 'var(--fg-primary)' }}>
            <MaskAmount card="stocks.holdings">{fmtByCurrency(ev, currency)}</MaskAmount>
          </div>
          <div className="num" style={{ fontSize: 'var(--text-badge)', fontWeight: 700, color: trendColor(pnl), marginTop: 1 }}>
            {pnl >= 0 ? '+' : ''}
            {pct.toFixed(2)}%
          </div>
        </>
      }
    />
  )
}

// ---- 종목 상세 ------------------------------------------------------------

/**
 * 상세 본문 — 헤더(별) · 현재가 · 차트 · 내 보유.
 *
 * 토스 상세와 달리 호가·체결·일별시세·기본정보가 없다. 나무 API 에 없어서다 — 빈 카드를
 * 자리만 채워 두면 사용자는 로딩이 안 끝난 걸로 읽는다.
 */
function NamuStockDetail({
  symbol,
  holding,
  holdingsCurrency,
  watched,
  onToggleWatch,
  mobile,
}: {
  symbol: string
  holding: NamuHoldingItem | null
  holdingsCurrency: string
  watched: boolean
  onToggleWatch: (marketCode?: string) => void
  mobile: boolean
}) {
  const { t } = useTranslation('stocks')
  const masterQ = useStockBySymbol(symbol)
  const master = masterQ.data ?? null
  const name = master?.nameKr ?? holding?.name ?? symbol
  // 보유 종목이면 잔고 탭의 통화가 곧 그 종목의 통화다. 아니면 마스터가 안다.
  const currency = holding ? holdingsCurrency : master?.currency ?? 'KRW'
  const countryCode = master?.countryCode ?? (currency === 'USD' ? 'US' : 'KR')
  const isUs = currency === 'USD'

  // 현재가 — 보유 종목이면 잔고 응답에 이미 있다(추가 호출 없음).
  // 관심 종목만 서버 대리 조회로 1콜. 나무는 다건 API 가 없어 여기서 아끼는 게 그대로 유량이다.
  const needsQuote = holding == null
  const quoteQ = useSecuritiesPrices(needsQuote ? [symbol] : [], WATCH_POLL_MS)
  const quote = quoteQ.data?.[0]
  const last = holding ? num(holding.currentPrice) : quote?.price ?? null
  const prevClose = holding ? null : quote?.previousClose ?? null
  const changePct = prevClose != null && prevClose > 0 && last != null ? ((last - prevClose) / prevClose) * 100 : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 헤더: 종목명·관심 토글 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <StockBadge name={name} symbol={symbol} countryCode={countryCode} size={46} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--fg-primary)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name}
          </div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span>{symbol}</span>
            {master && <span>·</span>}
            {master && <span>{t(`market.${master.marketCode}`, { defaultValue: master.marketCode })}</span>}
          </div>
        </div>
        <WatchStar watched={watched} onToggle={() => onToggleWatch(master?.marketCode)} />
      </div>

      {/* 현재가 */}
      <div>
        <div className="num" style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-primary)' }}>
          {last != null && last > 0 ? fmtByCurrency(last, currency) : '—'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
          {changePct != null && <PctBadge pct={changePct} size={14} />}
          {(last == null || last === 0) && !quoteQ.isLoading && (
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>{t('namu.priceEmpty')}</span>
          )}
        </div>
      </div>

      {/* 차트 — 캔들은 토스 크리덴셜이 필요하다. 카드가 알아서 가른다. */}
      <StockChartCard symbol={symbol} isUs={isUs} mobile={mobile} />

      {/* 내 보유 (보유 종목일 때) */}
      {holding && <NamuHoldingCard holding={holding} currency={currency} />}

      {/* 조회 범위 안내 — 나무가 아직 안 주는 것을 밝힌다. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--bg-sunken)', borderRadius: 'var(--radius-md)' }}>
        <Info size={14} color="var(--fg-tertiary)" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-secondary)', lineHeight: 1.45 }}>{t('namu.scopeNotice')}</span>
      </div>

      <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', textAlign: 'center', lineHeight: 1.5 }}>
        {t('disclaimer.line1')}
        <br />
        {t('disclaimer.line2')}
      </div>
    </div>
  )
}

/** 내 보유 — 잔고 응답이 주는 값만 쓴다(수수료·세금·매도가능수량은 나무가 안 준다). */
function NamuHoldingCard({ holding, currency }: { holding: NamuHoldingItem; currency: string }) {
  const { t } = useTranslation('stocks')
  const ev = num(holding.evalAmount)
  const pnl = num(holding.profitLoss)
  const qty = num(holding.quantity)
  const avg = num(holding.avgPrice)
  const cost = ev - pnl
  const pct = cost > 0 ? (pnl / cost) * 100 : 0
  const rows: Array<[string, React.ReactNode, string]> = [
    [t('holding.marketValue'), <MaskAmount card="stocks.detail" key="ev">{fmtByCurrency(ev, currency)}</MaskAmount>, 'var(--fg-primary)'],
    [t('holding.profitLoss'), <MaskAmount card="stocks.detail" key="pnl">{`${pnl >= 0 ? '+' : '−'}${fmtByCurrency(Math.abs(pnl), currency)}`}</MaskAmount>, trendColor(pnl)],
    [t('holding.quantity'), t('holding.sharesUnit', { count: qty }), 'var(--fg-primary)'],
    [t('holding.returnRate'), `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`, trendColor(pnl)],
    [t('holding.avgPrice'), fmtByCurrency(avg, currency), 'var(--fg-secondary)'],
    [t('holding.purchaseAmount'), <MaskAmount card="stocks.detail" key="cost">{fmtByCurrency(cost, currency)}</MaskAmount>, 'var(--fg-secondary)'],
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
}
