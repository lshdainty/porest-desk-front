import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { KRW, formatChangeRate, money } from "@/shared/lib/groo/format";
import { MaskAmount } from "@/shared/lib/groo/hide-amounts";
import { Card } from "@/shared/ui/card";
import { Sparkline } from "@/shared/ui/groo/charts";
import { Skeleton as SkeletonBase } from "@/shared/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { num, trendColor } from "@/features/stock/lib/format";
import {
  ListWrap,
  PanelEmpty,
  StockRow,
  StockSearchTrigger,
} from "@/features/stock/ui/stock-row";
import {
  StockSearchDialog,
  WatchGroupDialog,
} from "@/features/stock/ui/stock-dialogs";
import { HoldingsEmpty } from "@/features/stock/ui/portfolio-donut";
import {
  PortfolioOverview,
  type OverviewRow,
} from "@/features/stock/ui/portfolio-overview";
import {
  DetailPane,
  ListPanel,
  StocksShell,
} from "@/features/stock/ui/stocks-shell";
import {
  MarketStatusLine,
  SummaryStrip,
  type StatTile,
} from "@/features/stock/ui/summary-strip";
import { marketState } from "@/features/stock/lib/market-state";
import { WatchlistPanel } from "@/features/stock/ui/watchlist-panel";
import { useWatchlist } from "@/features/stock/model/useWatchlist";
import type {
  TossRankingItem,
  WatchGroup,
} from "@/features/stock/api/stockApi";
import {
  changePctOf,
  usePrevCloses,
  useTossAccounts,
  useTossExchangeRate,
  useTossHoldings,
  useTossIndicatorCandles,
  useTossIndicatorPrices,
  useTossMarketCalendarKr,
  useTossMarketCalendarUs,
  useTossPrices,
  useTossRankings,
  useTossStockInfo,
} from "@/features/stock/model/useTossStocks";
import { StockDetailBody } from "./detail/TossStockDetail";

type OutletCtx = { onAddTx: () => void; mobile: boolean };

/**
 * 상단 타일에 세울 지수. **토스 카탈로그 8종 안에서만 고른다** — 카탈로그엔 코스피·코스닥과
 * 국채 수익률(2·3·5·10·20·30년)뿐이고 나스닥·S&P·VIX 는 없다. 국채는 지수와 성격이 달라
 * (포인트가 아니라 %) 한 줄에 섞으면 자릿수가 안 맞는다.
 */
const INDEX_SYMBOLS: string[] = ["KOSPI", "KOSDAQ"];

/** 선택 상태 — 종목 심볼이거나 '전체 포트폴리오'(개요). 나무 화면과 같은 규칙이다. */
const OVERVIEW = "__overview__" as const;

// ---- 일별 시세 표 (토스 candles 1d) ---------------------------------------

// ---- 장 상태 바 (토스 market-calendar + 국내 지수) --------------------------

/**
 * 장 상태 점 — 상태 줄 왼쪽에 선다.
 *
 * 지수는 예전엔 여기 같이 붙어 있었는데 **요약 스트립 타일로 올렸다**. 지수는 "지금 열려
 * 있나" 와 성격이 다른 값이고, 얇은 줄 안에서는 숫자가 눈에 안 들어왔다.
 *
 * **나무엔 이 줄이 없다** — 나무 스펙에 휴장일·영업일 캘린더가 아예 없다.
 */
function MarketOpenState({ mobile }: { mobile: boolean }) {
  const { t } = useTranslation("stocks");
  const krQ = useTossMarketCalendarKr();
  const usQ = useTossMarketCalendarUs();
  const kr = marketState(
    krQ.data?.today.integrated?.regularMarket,
    "Asia/Seoul",
  );
  const us = marketState(usQ.data?.today.regularMarket, "America/New_York");
  const markets = [
    { name: mobile ? t("market.krShort") : t("market.krFull"), ...kr },
    { name: mobile ? t("market.usShort") : t("market.usFull"), ...us },
  ];
  return (
    <>
      {markets.map((m) => (
        <div
          key={m.name}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            whiteSpace: "nowrap",
            ...(mobile
              ? {
                  background: "var(--bg-sunken)",
                  padding: "5px 11px",
                  borderRadius: "var(--radius-full)",
                }
              : {}),
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "var(--radius-full)",
              flexShrink: 0,
              background: m.open
                ? "var(--status-success-fg)"
                : "var(--fg-tertiary)",
            }}
          />
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--fg-primary)",
            }}
          >
            {m.name}
          </span>
          <span
            style={{
              fontSize: "var(--text-caption)",
              color: m.open ? "var(--fg-secondary)" : "var(--fg-tertiary)",
            }}
          >
            {t(m.labelKey, m.time ? { time: m.time } : undefined)}
          </span>
        </div>
      ))}
    </>
  );
}

// ---- 포트폴리오 구성 도넛 (데스크톱) ----------------------------------------

function RankRow({
  item,
  name,
  index,
  active,
  onPick,
  mobile = false,
}: {
  item: TossRankingItem;
  name: string | undefined;
  index: number;
  active: boolean;
  onPick: (symbol: string) => void;
  mobile?: boolean;
}) {
  const last = num(item.price.lastPrice);
  const changePct =
    item.price.changeRate != null ? num(item.price.changeRate) * 100 : null;
  return (
    // 모바일은 행이 자체 좌우 여백을 갖지 않으므로 순위 컬럼과의 간격은 gap 이 맡고,
    // 순위 숫자도 페이지 여백에서 시작한다(통계 가맹점 순위와 같은 결정).
    <div
      style={{ display: "flex", alignItems: "center", gap: mobile ? 14 : 0 }}
    >
      <span
        className="num"
        style={{
          width: 22,
          textAlign: mobile ? "left" : "center",
          flexShrink: 0,
          fontSize: "var(--text-label-sm)",
          fontWeight: 700,
          color: index < 3 ? "var(--fg-brand)" : "var(--fg-tertiary)",
        }}
      >
        {item.rank}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <StockRow
          mobile={mobile}
          stock={{
            symbol: item.symbol,
            name: name ?? item.symbol,
            currency: item.currency,
          }}
          active={active}
          onClick={() => onPick(item.symbol)}
          price={last > 0 ? last : null}
          changePct={changePct}
        />
      </div>
    </div>
  );
}

// 랭킹 로딩 스켈레톤 — RankRow/StockRow 의 골격(순위 22 + 12px 상하 패딩)을
// 그대로 따라, 로딩→실데이터 전환에서 행 위치가 튀지 않게 한다.
function RankRowsSkeleton({
  mobile,
  label,
}: {
  mobile: boolean;
  label: string;
}) {
  // 행 수는 useTossRankings 의 count: 10 과 동일.
  const rows = Array.from({ length: 10 }, (_, i) => (
    <div
      key={i}
      style={{ display: "flex", alignItems: "center", gap: mobile ? 14 : 0 }}
    >
      {/* 순위 컬럼 — RankRow 와 같은 width 22, 모바일 좌측 / 데스크톱 가운데 정렬. */}
      <div
        style={{
          width: 22,
          flexShrink: 0,
          display: "flex",
          justifyContent: mobile ? "flex-start" : "center",
        }}
      >
        <SkeletonBase className="h-3 w-3.5" />
      </div>
      {/* StockRow 자리 — padding/gap 을 StockRow 에서 그대로 가져온다. */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: mobile ? "12px 0" : "12px 14px",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <SkeletonBase className="h-4 w-1/2" />
          <SkeletonBase className="h-3 w-1/4" style={{ marginTop: 3 }} />
        </div>
        {/* 가격·등락률 컬럼 — StockRow 의 minWidth 78 우측 정렬. */}
        <div style={{ flexShrink: 0, minWidth: 78 }}>
          <SkeletonBase className="h-4 w-16 ml-auto" />
          <SkeletonBase className="h-3 w-12 ml-auto" style={{ marginTop: 3 }} />
        </div>
      </div>
    </div>
  ));
  // 껍데기는 실렌더와 같은 분기 — 모바일은 맨몸 div, 데스크톱은 Card padding 6.
  return mobile ? (
    <div aria-busy aria-label={label}>
      {rows}
    </div>
  ) : (
    <Card style={{ padding: 6 }} aria-busy aria-label={label}>
      {rows}
    </Card>
  );
}

function DiscoverPanel({
  onPick,
  selected,
  mobile = false,
}: {
  onPick: (t: string) => void;
  selected: string | null;
  mobile?: boolean;
}) {
  const { t } = useTranslation("stocks");
  const [market, setMarket] = useState<"KR" | "US">("KR");
  const [tab, setTab] = useState<"gainers" | "losers" | "volume">("gainers");
  // TOP_GAINERS/LOSERS 는 realtime 미지원 → 1d, 거래량은 실시간.
  const type =
    tab === "gainers"
      ? "TOP_GAINERS"
      : tab === "losers"
        ? "TOP_LOSERS"
        : "MARKET_TRADING_VOLUME";
  const duration = tab === "volume" ? "realtime" : "1d";
  const q = useTossRankings(type, market, duration, { count: 10 });
  const rankings = q.data?.rankings ?? [];
  // 랭킹 응답엔 종목명이 없어 토스 종목정보로 배치 조회한다.
  const infoQ = useTossStockInfo(rankings.map((r) => r.symbol));
  const nameOf = useMemo(() => {
    const map = new Map<string, string>();
    for (const i of infoQ.data ?? []) map.set(i.symbol, i.name);
    return map;
  }, [infoQ.data]);

  const rows = rankings.map((r, i) => (
    <RankRow
      key={`${r.symbol}`}
      item={r}
      name={nameOf.get(r.symbol)}
      index={i}
      active={selected === r.symbol}
      onPick={onPick}
      mobile={mobile}
    />
  ));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "gainers" | "losers" | "volume")}
        >
          <TabsList variant="pill" size="sm">
            <TabsTrigger variant="pill" value="gainers">
              {t("discover.gainers")}
            </TabsTrigger>
            <TabsTrigger variant="pill" value="losers">
              {t("discover.losers")}
            </TabsTrigger>
            <TabsTrigger variant="pill" value="volume">
              {t("discover.volume")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div style={{ marginLeft: "auto" }}>
          <Tabs
            value={market}
            onValueChange={(v) => setMarket(v as "KR" | "US")}
          >
            <TabsList variant="pill" size="sm">
              <TabsTrigger variant="pill" value="KR">
                {t("market.krShort")}
              </TabsTrigger>
              <TabsTrigger variant="pill" value="US">
                {t("market.usShort")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      {q.isLoading ? (
        // 탭·시장 토글은 정적이라 그대로 렌더하고, 서버 데이터가 들어갈 행 영역만 스켈레톤으로 채운다.
        <RankRowsSkeleton mobile={mobile} label={t("discover.loading")} />
      ) : rows.length === 0 ? (
        <PanelEmpty msg={t("discover.empty")} />
      ) : mobile ? (
        <div>{rows}</div>
      ) : (
        <Card style={{ padding: 6 }}>{rows}</Card>
      )}
    </div>
  );
}

/**
 * 토스증권 본문.
 *
 * 나무 화면과 **합치지 않는다.** 두 증권사가 주는 데이터가 겹치지 않아 한 화면에 합치면
 * 절반이 "이 증권사는 미지원" 이 된다. 연결 게이트와 증권사 선택은 셸(StocksPage)이 맡는다.
 *
 * @param header 셸이 끼워 넣는 증권사 탭. 연결이 하나뿐이면 없다.
 */
export function TossStocksDesktop({ header }: { header?: React.ReactNode }) {
  const { t } = useTranslation("stocks");
  const { mobile } = useOutletContext<OutletCtx>();
  const [selected, setSelected] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [seg, setSeg] = useState<"holdings" | "watch" | "discover">("holdings");

  // 관심목록 — 서버 영속(stock-watch). 그룹 탭 + 별 토글. 증권사와 무관해 나무와 공용이다.
  const watchlist = useWatchlist();
  const [groupDialog, setGroupDialog] = useState<{
    open: boolean;
    group: WatchGroup | null;
  }>({ open: false, group: null });

  // 보유자산 — 키 연결 시 실데이터(/toss/accounts→/toss/holdings), 미연결 시 빈 상태.
  const { data: accounts } = useTossAccounts();
  const accountSeq = accounts?.[0]?.accountSeq ?? null;
  const { data: holdings } = useTossHoldings(accountSeq);
  const holdingItems = useMemo(
    () =>
      holdings
        ? [...holdings.items].sort(
            (a, b) => num(b.marketValue.amount) - num(a.marketValue.amount),
          )
        : [],
    [holdings],
  );
  // 환율 (요약 타일 + 상세 원화 환산)
  const fxQ = useTossExchangeRate();
  // 국내 지수 현재가 (토스 시장지표 — KOSPI·KOSDAQ 포인트). 나무엔 대응 API 가 없다.
  const idxQ = useTossIndicatorPrices(INDEX_SYMBOLS);
  // 지수 추이선. 지수 수만큼(2콜)만 나가고 실패해도 숫자 타일은 그대로다.
  const idxCandles = useTossIndicatorCandles(INDEX_SYMBOLS);

  // 데스크톱: 기본 선택 = 첫 보유 종목. 보유가 없으면 개요를 띄운다(빈 안내문 대신).
  // 한 번 고르면 조건이 닫히므로 렌더 중에 맞춰도 반복되지 않는다.
  if (!mobile && !selected) {
    setSelected(holdingItems.length > 0 ? holdingItems[0]!.symbol : OVERVIEW);
  }

  // 요약 (서버 계산값)
  const totalEval = holdings ? num(holdings.marketValue.amount.krw) : 0;
  const totalCost = holdings ? num(holdings.totalPurchaseAmount.krw) : 0;
  const totalPnl = holdings ? num(holdings.profitLoss.amount.krw) : 0;
  const totalPnlPct = holdings ? num(holdings.profitLoss.rate) : 0;
  const dailyPnl = holdings ? num(holdings.dailyProfitLoss.amount.krw) : 0;
  const dailyPnlPct = holdings ? num(holdings.dailyProfitLoss.rate) : 0;
  const curGroup = watchlist.activeGroup;
  const selHolding =
    selected && selected !== OVERVIEW
      ? (holdingItems.find((h) => h.symbol === selected) ?? null)
      : null;
  const fxRate = fxQ.data ? num(fxQ.data.rate) : null;

  // 관심 탭 시세 — 현재 그룹 심볼 배치 1콜 (10초 폴링은 useTossPrices 공통).
  // 전일 종가는 토스가 시세에 안 실어 줘 종목마다 일봉을 따로 받는다(usePrevCloses 는
  // usePrevClose 와 같은 쿼리키라 상세 화면과 캐시가 겹친다). 나무는 이 조달이 달라
  // 패널이 시세를 직접 안 부르고 priceOf 로 주입받는다.
  const watchSymbols = useMemo(
    () =>
      seg === "watch" && curGroup ? curGroup.items.map((i) => i.symbol) : [],
    [seg, curGroup],
  );
  const watchPricesQ = useTossPrices(watchSymbols);
  const watchPrevCloses = usePrevCloses(watchSymbols);
  const watchPriceMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of watchPricesQ.data ?? []) {
      const v = Number.parseFloat(p.lastPrice);
      if (Number.isFinite(v)) map.set(p.symbol, v);
    }
    return map;
  }, [watchPricesQ.data]);

  // ---- 1층: 요약 스트립 -----------------------------------------------------
  //
  // **있는 타일만 만든다.** 지수는 토스 카탈로그 8종 안에 있는 것만 온다.
  const tiles: StatTile[] = [];
  if (holdings) {
    tiles.push({
      id: "total",
      hero: true,
      label: t("summary.title"),
      value: (
        <MaskAmount card="stocks.holdings">{`${KRW(totalEval)}원`}</MaskAmount>
      ),
      sub: (
        <MaskAmount card="stocks.holdings">
          {`${totalPnl >= 0 ? "+" : "−"}${money(totalPnl, { abs: true })} · ${formatChangeRate(totalPnlPct, { sign: "always" })} · ${t("holding.purchaseAmount")} ${money(totalCost)}`}
        </MaskAmount>
      ),
    });
    tiles.push({
      id: "daily",
      label: t("holding.dailyPnl"),
      tone: trendColor(dailyPnl),
      value: (
        <MaskAmount card="stocks.holdings">{`${dailyPnl >= 0 ? "+" : "−"}${money(dailyPnl, { abs: true })}`}</MaskAmount>
      ),
      sub: `${formatChangeRate(dailyPnlPct, { sign: "always" })} · ${t("summary.holdingsCount")} ${t("unit.count", { count: holdingItems.length })}`,
    });
  }
  for (const i of idxQ.data ?? []) {
    if (num(i.lastPrice) <= 0) continue;
    const series = idxCandles.get(i.symbol);
    // 추세 색은 **그 구간의 시작 대비 지금**으로 정한다 — 선이 올라가면 빨강, 내려가면 파랑.
    const trendPct =
      series && series.length >= 2 && series[0]! > 0
        ? ((series[series.length - 1]! - series[0]!) / series[0]!) * 100
        : null;
    tiles.push({
      id: i.symbol,
      label: i.symbol === "KOSPI" ? t("market.KOSPI") : t("market.KOSDAQ"),
      value: num(i.lastPrice).toLocaleString(undefined, {
        maximumFractionDigits: 2,
      }),
      sub:
        trendPct != null
          ? `${formatChangeRate(trendPct, { sign: "always" })}`
          : t("market.indexPoint"),
      // 캔들을 못 받으면 추이선만 빠지고 숫자는 남는다.
      graphic: series ? (
        <Sparkline
          values={series}
          height={22}
          color={trendColor(trendPct ?? 0)}
        />
      ) : undefined,
    });
  }
  if (fxRate != null && fxRate > 0) {
    tiles.push({
      id: "fx",
      label: t("summary.fxRate"),
      value: `₩${Math.round(fxRate).toLocaleString()}`,
      sub: t("market.fxBase"),
    });
  }

  const strip = !holdings ? (
    <Card
      variant={mobile ? "raised" : undefined}
      style={{ padding: mobile ? 18 : 22 }}
    >
      <div
        style={{ fontSize: 12.5, color: "var(--fg-tertiary)", fontWeight: 600 }}
      >
        {t("summary.title")}
      </div>
      <div
        style={{
          fontSize: "var(--text-body-sm)",
          color: "var(--fg-tertiary)",
          marginTop: 8,
        }}
      >
        {t("summary.connectPrompt")}
      </div>
    </Card>
  ) : (
    <SummaryStrip tiles={tiles} mobile={mobile} />
  );

  const statusLine = (
    <MarketStatusLine mobile={mobile} notice={t("market.dataNotice")}>
      <MarketOpenState mobile={mobile} />
    </MarketStatusLine>
  );

  // ---- 3층 좌: 목록 --------------------------------------------------------
  const holdingsList = !holdings ? (
    <HoldingsEmpty mobile={mobile} />
  ) : holdingItems.length === 0 ? (
    <ListWrap mobile={mobile} fill={!mobile}>
      <div
        style={{
          padding: "32px 20px",
          textAlign: "center",
          color: "var(--fg-tertiary)",
          fontSize: "var(--text-label-sm)",
        }}
      >
        {t("holdings.empty")}
      </div>
    </ListWrap>
  ) : (
    <ListWrap mobile={mobile} fill={!mobile}>
      {/* 전체 포트폴리오 — 우측을 구성 도넛 + 비중 표 + 랭킹으로 바꾼다. */}
      <StockRow
        mobile={mobile}
        stock={{
          symbol: OVERVIEW,
          name: t("portfolio.allTitle"),
          currency: "KRW",
        }}
        hideSymbol
        active={selected === OVERVIEW}
        onClick={() => setSelected(OVERVIEW)}
        sub={t("portfolio.allSub")}
        right={
          <div
            className="num"
            style={{
              fontSize: "var(--text-body-sm)",
              fontWeight: 700,
              color: "var(--fg-primary)",
            }}
          >
            <MaskAmount card="stocks.holdings">{money(totalEval)}</MaskAmount>
          </div>
        }
      />
      {holdingItems.map((h) => {
        const ev = num(h.marketValue.amount);
        const pnl = num(h.profitLoss.amount);
        const pct = num(h.profitLoss.rate);
        return (
          <StockRow
            mobile={mobile}
            key={h.symbol}
            stock={{
              symbol: h.symbol,
              name: h.name || h.symbol,
              currency: h.currency,
            }}
            active={selected === h.symbol}
            onClick={() => setSelected(h.symbol)}
            sub={t("holding.sharesHeld", { count: h.quantity })}
            right={
              <>
                <div
                  className="num"
                  style={{
                    fontSize: "var(--text-body-sm)",
                    fontWeight: 700,
                    color: "var(--fg-primary)",
                  }}
                >
                  <MaskAmount card="stocks.holdings">{money(ev)}</MaskAmount>
                </div>
                <div
                  className="num"
                  style={{
                    fontSize: "var(--text-badge)",
                    fontWeight: 700,
                    color: trendColor(pnl),
                    marginTop: 1,
                  }}
                >
                  {formatChangeRate(pct, { sign: "always" })}
                </div>
              </>
            }
          />
        );
      })}
    </ListWrap>
  );

  const list = (
    <ListPanel
      mobile={mobile}
      search={<StockSearchTrigger onClick={() => setSearchOpen(true)} />}
      segments={
        <Tabs
          value={seg}
          onValueChange={(v) => setSeg(v as "holdings" | "watch" | "discover")}
        >
          <TabsList variant="pill" size="sm">
            <TabsTrigger variant="pill" value="holdings">
              {t("segments.holdings", { count: holdingItems.length })}
            </TabsTrigger>
            <TabsTrigger variant="pill" value="watch">
              {t("segments.watch", { count: watchlist.watchedSymbols.size })}
            </TabsTrigger>
            <TabsTrigger variant="pill" value="discover">
              {t("segments.discover")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      }
    >
      {seg === "discover" ? (
        <DiscoverPanel
          onPick={setSelected}
          selected={selected}
          mobile={mobile}
        />
      ) : seg === "holdings" ? (
        holdingsList
      ) : (
        <WatchlistPanel
          watchlist={watchlist}
          mobile={mobile}
          selected={selected}
          onSelect={setSelected}
          onEditGroup={(group) => setGroupDialog({ open: true, group })}
          priceOf={(sym) => ({
            price: watchPriceMap.get(sym) ?? null,
            changePct: changePctOf(
              watchPriceMap.get(sym) ?? null,
              watchPrevCloses.get(sym),
            ),
          })}
        />
      )}
    </ListPanel>
  );

  // ---- 3층 우: 상세 또는 개요 ------------------------------------------------
  const overviewRows: OverviewRow[] = holdingItems.map((h) => ({
    symbol: h.symbol,
    name: h.name || h.symbol,
    amountText: money(num(h.marketValue.amount)),
    weightPct:
      totalEval > 0 ? (num(h.marketValue.amount) / totalEval) * 100 : null,
    profitPct: num(h.profitLoss.rate),
  }));

  const detailBody =
    selected === OVERVIEW || (selected == null && !mobile) ? (
      <PortfolioOverview
        mobile={mobile}
        title={t("portfolio.allTitle")}
        totalText={`${KRW(totalEval)}원`}
        subText={`${totalPnl >= 0 ? "+" : "−"}${money(totalPnl, { abs: true })} · ${formatChangeRate(totalPnlPct, { sign: "always" })}`}
        slices={holdingItems.map((h) => ({
          name: h.name || h.symbol,
          value: num(h.marketValue.amount),
        }))}
        rows={overviewRows}
        // 토스에만 랭킹이 있다 — 개요 아래에 붙여 우측 단을 끝까지 채운다.
        extra={
          <DiscoverPanel
            onPick={setSelected}
            selected={selected}
            mobile={mobile}
          />
        }
      />
    ) : selected ? (
      <StockDetailBody
        ticker={selected}
        holding={selHolding}
        watched={watchlist.isWatched(selected)}
        onToggleWatch={(mc) => watchlist.toggleWatch(selected, mc)}
        mobile={mobile}
      />
    ) : null;

  const dialogs = (
    <>
      {searchOpen && (
        <StockSearchDialog
          mobile={mobile}
          onPick={(item) => setSelected(item.symbol)}
          onClose={() => setSearchOpen(false)}
        />
      )}
      {groupDialog.open && (
        <WatchGroupDialog
          mobile={mobile}
          group={groupDialog.group}
          onClose={() => setGroupDialog({ open: false, group: null })}
        />
      )}
    </>
  );

  return (
    <StocksShell
      mobile={mobile}
      header={header}
      strip={strip}
      statusLine={statusLine}
      list={list}
      detail={<DetailPane mobile={mobile}>{detailBody}</DetailPane>}
      detailOpen={selected != null}
      onCloseDetail={() => setSelected(null)}
      dialogs={dialogs}
    />
  );
}
