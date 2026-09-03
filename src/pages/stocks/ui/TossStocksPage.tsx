import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { tileRadius } from "@/shared/lib";
import { KRW, money } from "@/shared/lib/porest/format";
import { MaskAmount } from "@/shared/lib/porest/hide-amounts";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Sparkline } from "@/shared/ui/porest/charts";
import { Skeleton as SkeletonBase } from "@/shared/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
  fmtByCurrency,
  fmtCapKRW,
  fmtShares,
  num,
  trendColor,
} from "@/features/stock/lib/format";
import {
  ListWrap,
  PanelEmpty,
  PctBadge,
  StockBadge,
  StockRow,
  StockSearchTrigger,
  WatchStar,
} from "@/features/stock/ui/stock-row";
import { StockChartCard } from "@/features/stock/ui/stock-chart-card";
import {
  StockSearchDialog,
  WatchGroupDialog,
} from "@/features/stock/ui/stock-dialogs";
import { HoldingsEmpty } from "@/features/stock/ui/portfolio-donut";
import { DailyQuoteTable } from "@/features/stock/ui/daily-quote-table";
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
import { WatchlistPanel } from "@/features/stock/ui/watchlist-panel";
import { useWatchlist } from "@/features/stock/model/useWatchlist";
import type {
  TossHoldingsItem,
  TossMarketSession,
  TossOrderbook,
  TossRankingItem,
  TossStockInfo,
  TossTrade,
  WatchGroup,
} from "@/features/stock/api/stockApi";
import {
  changePctOf,
  usePrevClose,
  usePrevCloses,
  useTossAccounts,
  useTossExchangeRate,
  useTossHoldings,
  useTossIndicatorCandles,
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
} from "@/features/stock/model/useTossStocks";
import { useStockBySymbol } from "@/features/stock/model/useStockMaster";

type OutletCtx = { onAddTx: () => void; mobile: boolean };

/**
 * 상단 타일에 세울 지수. **토스 카탈로그 8종 안에서만 고른다** — 카탈로그엔 코스피·코스닥과
 * 국채 수익률(2·3·5·10·20·30년)뿐이고 나스닥·S&P·VIX 는 없다. 국채는 지수와 성격이 달라
 * (포인트가 아니라 %) 한 줄에 섞으면 자릿수가 안 맞는다.
 */
const INDEX_SYMBOLS: string[] = ["KOSPI", "KOSDAQ"];

/** 선택 상태 — 종목 심볼이거나 '전체 포트폴리오'(개요). 나무 화면과 같은 규칙이다. */
const OVERVIEW = "__overview__" as const;

/** 라이브 체결 테이프 변환 (토스 trades). dir=직전 체결가 대비 방향. */
function liveTradeFills(
  trades?: TossTrade[],
): { time: string; p: number; q: number; dir: number }[] {
  if (!trades || trades.length === 0) return [];
  return trades.slice(0, 12).map((t, i, arr) => {
    const p = Number.parseFloat(t.price);
    const prev = i + 1 < arr.length ? Number.parseFloat(arr[i + 1]!.price) : p;
    const time = /(\d{2}:\d{2}:\d{2})/.exec(t.timestamp)?.[1] ?? t.timestamp;
    return {
      time,
      p,
      q: Math.round(Number.parseFloat(t.volume)),
      dir: p >= prev ? 1 : -1,
    };
  });
}

/** 호가 헤더행 — 라벨뿐인 정적 틀이라 로딩 중에도 그대로 렌더해야 해서 스켈레톤과 공용으로 뽑았다. */
function OrderBookHead() {
  const { t } = useTranslation("stocks");
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 92px 1fr",
        fontSize: 10.5,
        color: "var(--fg-tertiary)",
        fontWeight: 600,
        marginBottom: 4,
        padding: "0 2px",
      }}
    >
      <span style={{ textAlign: "right", paddingRight: 6 }}>
        {t("orderbook.bidVolume")}
      </span>
      <span />
      <span style={{ textAlign: "left", paddingLeft: 6 }}>
        {t("orderbook.askVolume")}
      </span>
    </div>
  );
}

/** 호가 중앙 현재가 띠 — 값이 orderbook 이 아니라 시세 쿼리에서 오므로 호가 로딩 중에도 실값을 그린다. */
function OrderBookMid({
  currency,
  lastPrice,
  changePct,
}: {
  currency: string;
  lastPrice: number | null;
  changePct: number;
}) {
  return (
    <div
      style={{
        borderTop: "1px dashed var(--border-subtle)",
        borderBottom: "1px dashed var(--border-subtle)",
        margin: "3px 0",
        padding: "5px 0",
        textAlign: "center",
      }}
    >
      <span
        className="num"
        style={{
          fontSize: "var(--text-label-sm)",
          fontWeight: 800,
          color: trendColor(changePct),
        }}
      >
        {lastPrice != null ? fmtByCurrency(lastPrice, currency) : "—"}
      </span>
      <span style={{ marginLeft: 6 }}>
        <PctBadge pct={changePct} size={11} />
      </span>
    </div>
  );
}

function OrderBook({
  currency,
  lastPrice,
  book,
  changePct,
}: {
  currency: string;
  lastPrice: number | null;
  book: TossOrderbook;
  changePct: number;
}) {
  const fmt = (p: number) => fmtByCurrency(p, currency);
  // asks=낮은가격순 → 상단(높은가격 위) 위해 5개 잘라 역순, bids=높은가격순 그대로.
  const asks = book.asks
    .slice(0, 5)
    .map((e) => ({
      p: Number.parseFloat(e.price),
      q: Math.round(Number.parseFloat(e.volume)),
    }))
    .reverse();
  const bids = book.bids.slice(0, 5).map((e) => ({
    p: Number.parseFloat(e.price),
    q: Math.round(Number.parseFloat(e.volume)),
  }));
  const maxQ = Math.max(1, ...asks.map((a) => a.q), ...bids.map((b) => b.q));

  const Row = ({
    p,
    q,
    type,
  }: {
    p: number;
    q: number;
    type: "ask" | "bid";
  }) => {
    const isAsk = type === "ask";
    const col = isAsk ? "var(--fg-brand)" : "var(--status-danger-fg)";
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 92px 1fr",
          alignItems: "center",
          height: 26,
        }}
      >
        {isAsk ? (
          <span />
        ) : (
          <div
            style={{
              position: "relative",
              height: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                width: `${(q / maxQ) * 100}%`,
                background:
                  "color-mix(in oklab, var(--status-danger-fg) 13%, var(--bg-surface))",
                borderRadius: 4,
              }}
            />
            <span
              className="num"
              style={{
                position: "relative",
                fontSize: "var(--text-badge)",
                color: "var(--fg-tertiary)",
                paddingRight: 6,
              }}
            >
              {q.toLocaleString()}
            </span>
          </div>
        )}
        <div
          style={{
            textAlign: "center",
            position: "relative",
            height: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            className="num"
            style={{ fontSize: 12.5, fontWeight: 700, color: col }}
          >
            {fmt(p)}
          </span>
        </div>
        {isAsk ? (
          <div
            style={{
              position: "relative",
              height: 22,
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: `${(q / maxQ) * 100}%`,
                background:
                  "color-mix(in oklab, var(--fg-brand) 14%, var(--bg-surface))",
                borderRadius: 4,
              }}
            />
            <span
              className="num"
              style={{
                position: "relative",
                fontSize: "var(--text-badge)",
                color: "var(--fg-tertiary)",
                paddingLeft: 6,
              }}
            >
              {q.toLocaleString()}
            </span>
          </div>
        ) : (
          <span />
        )}
      </div>
    );
  };

  return (
    <div>
      <OrderBookHead />
      {asks.map((a, i) => (
        <Row key={`a${i}`} {...a} type="ask" />
      ))}
      <OrderBookMid
        currency={currency}
        lastPrice={lastPrice}
        changePct={changePct}
      />
      {bids.map((b, i) => (
        <Row key={`b${i}`} {...b} type="bid" />
      ))}
    </div>
  );
}

// ---- 호가 / 체결 탭 카드 (실데이터 전용 · 로딩/빈 상태) -----------------------

/** 체결 테이프 헤더행 — 정적 라벨이라 로딩에도 그대로 렌더(스켈레톤·실렌더 공용). */
function TradeTapeHead() {
  const { t } = useTranslation("stocks");
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1.2fr 1fr",
        fontSize: 10.5,
        color: "var(--fg-tertiary)",
        fontWeight: 600,
        marginBottom: 4,
        padding: "0 2px",
      }}
    >
      <span>{t("quotes.tradeTime")}</span>
      <span style={{ textAlign: "right" }}>{t("quotes.tradePrice")}</span>
      <span style={{ textAlign: "right" }}>{t("quotes.tradeVolume")}</span>
    </div>
  );
}

// 잔량 바 폭 — 실렌더는 (q/maxQ)*100% 라 행마다 다르다. 리렌더마다 흔들리지 않게 5행치 고정.
const OB_BAR_W = ["62%", "38%", "78%", "45%", "55%"];

/**
 * 호가 로딩 — OrderBook 실렌더 정합: 헤더행 + 매도 5행 + 현재가 띠 + 매수 5행.
 * 행은 Row 와 같은 grid '1fr 92px 1fr' · height 26 이고, 잔량 바는 Row 안 height 22 자리를 그대로 차지한다
 * (바 radius 4 = SkeletonBase 기본 rounded-sm).
 */
function OrderBookSkeleton({
  currency,
  lastPrice,
  changePct,
  label,
}: {
  currency: string;
  lastPrice: number | null;
  changePct: number;
  label: string;
}) {
  const row = (key: string, type: "ask" | "bid", w: string) => (
    <div
      key={key}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 92px 1fr",
        alignItems: "center",
        height: 26,
      }}
    >
      {type === "bid" ? (
        // 매수 잔량 바는 실렌더에서 right:0 기준이라 오른쪽 정렬
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <SkeletonBase className="h-[22px]" style={{ width: w }} />
        </div>
      ) : (
        <span />
      )}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <SkeletonBase className="h-3 w-14" />
      </div>
      {type === "ask" ? (
        <SkeletonBase className="h-[22px]" style={{ width: w }} />
      ) : (
        <span />
      )}
    </div>
  );
  return (
    // 문구 로딩을 스켈레톤으로 바꾸면 스크린리더에 남는 안내가 없어진다 —
    // 기존 로딩 문구를 aria-label 로 살려 둔다(skeleton.md Accessibility 절).
    <div aria-busy aria-label={label}>
      <OrderBookHead />
      {OB_BAR_W.map((w, i) => row(`a${i}`, "ask", w))}
      <OrderBookMid
        currency={currency}
        lastPrice={lastPrice}
        changePct={changePct}
      />
      {[...OB_BAR_W].reverse().map((w, i) => row(`b${i}`, "bid", w))}
    </div>
  );
}

/** 체결 로딩 — 헤더행은 실제로 그리고, liveTradeFills 가 slice(0, 12) 라 데이터 12행(height 25)만 스켈레톤. */
function TradeTapeSkeleton({ label }: { label: string }) {
  return (
    <div aria-busy aria-label={label}>
      <TradeTapeHead />
      {Array.from({ length: 12 }, (_, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.2fr 1fr",
            alignItems: "center",
            height: 25,
          }}
        >
          <SkeletonBase className="h-3 w-12" />
          <SkeletonBase className="h-3 w-14 ml-auto" />
          <SkeletonBase className="h-3 w-10 ml-auto" />
        </div>
      ))}
    </div>
  );
}

function QuotesCard({
  symbol,
  currency,
  lastPrice,
  changePct,
}: {
  symbol: string;
  currency: string;
  lastPrice: number | null;
  changePct: number;
}) {
  const { t } = useTranslation("stocks");
  const [tab, setTab] = useState<"book" | "tape">("book");
  const orderbookQ = useTossOrderbook(symbol);
  const tradesQ = useTossTrades(symbol);
  const fmt = (p: number) => fmtByCurrency(p, currency);
  const book = orderbookQ.data;
  const hasBook = !!book && book.asks.length > 0 && book.bids.length > 0;
  const fills = liveTradeFills(tradesQ.data);
  return (
    <Card style={{ padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <Tabs value={tab} onValueChange={(v) => setTab(v as "book" | "tape")}>
          <TabsList variant="pill" size="sm" style={{ width: "100%" }}>
            <TabsTrigger variant="pill" value="book" style={{ flex: 1 }}>
              {t("quotes.orderbook")}
            </TabsTrigger>
            <TabsTrigger variant="pill" value="tape" style={{ flex: 1 }}>
              {t("quotes.trades")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {tab === "book" ? (
        orderbookQ.isLoading ? (
          <OrderBookSkeleton
            currency={currency}
            lastPrice={lastPrice}
            changePct={changePct}
            label={t("quotes.orderbookLoading")}
          />
        ) : hasBook ? (
          <OrderBook
            currency={currency}
            lastPrice={lastPrice}
            book={book}
            changePct={changePct}
          />
        ) : (
          <PanelEmpty msg={t("quotes.orderbookEmpty")} />
        )
      ) : tradesQ.isLoading ? (
        <TradeTapeSkeleton label={t("quotes.tradesLoading")} />
      ) : fills.length === 0 ? (
        <PanelEmpty msg={t("quotes.tradesEmpty")} />
      ) : (
        <div>
          <TradeTapeHead />
          {fills.map((f, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.2fr 1fr",
                alignItems: "center",
                height: 25,
                fontSize: 12,
              }}
            >
              <span className="num" style={{ color: "var(--fg-tertiary)" }}>
                {f.time}
              </span>
              <span
                className="num"
                style={{
                  textAlign: "right",
                  fontWeight: 700,
                  color: trendColor(f.dir),
                }}
              >
                {fmt(f.p)}
              </span>
              <span
                className="num"
                style={{ textAlign: "right", color: "var(--fg-secondary)" }}
              >
                {f.q.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ---- 일별 시세 표 (토스 candles 1d) ---------------------------------------

// ---- 장 상태 바 (토스 market-calendar + 국내 지수) --------------------------

/** 'HH:MM:SS' → 'HH:MM' */
const hhmm = (t?: string | null) => (t ? t.slice(0, 5) : null);

/** 시장 현지 시각 'HH:MM' (TZ 무관 — Intl) */
function nowInTz(tz: string): string {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date());
  const h = p.find((x) => x.type === "hour")?.value ?? "00";
  const m = p.find((x) => x.type === "minute")?.value ?? "00";
  return `${h}:${m}`;
}

type MarketStatus = { open: boolean; labelKey: string; time?: string };

function marketState(
  session: TossMarketSession | null | undefined,
  tz: string,
): MarketStatus {
  const start = hhmm(session?.startTime);
  const end = hhmm(session?.endTime);
  if (!start || !end) return { open: false, labelKey: "market.holiday" };
  const now = nowInTz(tz);
  if (now >= start && now <= end)
    return { open: true, labelKey: "market.live", time: now };
  if (now < start)
    return { open: false, labelKey: "market.preopen", time: start };
  return { open: false, labelKey: "market.afterClose" };
}

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
  const country = /^[A-Za-z]/.test(item.symbol) ? "US" : "KR";
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
            countryCode: country,
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

// 랭킹 로딩 스켈레톤 — RankRow/StockRow 의 골격(순위 22 + 배지 40 + 12px 상하 패딩 = 행 높이 64)을
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
      {/* StockRow 자리 — padding/gap/배지 크기를 StockRow 에서 그대로 가져온다. */}
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
        <SkeletonBase
          className="h-10 w-10 shrink-0"
          style={{ borderRadius: tileRadius(40) }}
        />
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

// ---- 종목 기본정보 (토스 stocks + price-limits) ----------------------------

function StockInfoCard({
  symbol,
  currency,
  info,
  lastPrice,
  fxRate,
}: {
  symbol: string;
  currency: string;
  info: TossStockInfo | undefined;
  lastPrice: number | null;
  fxRate: number | null;
}) {
  const { t } = useTranslation("stocks");
  const limitsQ = useTossPriceLimits(symbol);
  const limits = limitsQ.data;
  const shares = num(info?.sharesOutstanding);
  const isUs = currency === "USD";
  const isKr = currency === "KRW";
  // 시가총액 = 현재가 × 발행주식수 (USD 는 환율 환산). 시세가 없으면 표시하지 않는다.
  const priceInKrw =
    lastPrice == null
      ? null
      : isUs
        ? fxRate == null
          ? null
          : lastPrice * fxRate
        : isKr
          ? lastPrice
          : null;
  const mcKRW = priceInKrw != null && shares > 0 ? priceInKrw * shares : null;
  const upper = limits?.upperLimitPrice ? num(limits.upperLimitPrice) : null;
  const lower = limits?.lowerLimitPrice ? num(limits.lowerLimitPrice) : null;
  const rows: Array<{ k: string; v: string; c?: string }> = [
    {
      k: t("info.market"),
      v: info ? info.market : isUs ? t("market.usShort") : t("market.krShort"),
    },
    {
      k: t("info.securityType"),
      v: info?.securityType === "ETF" ? "ETF" : t("info.stock"),
    },
    { k: t("info.currency"), v: info?.currency ?? currency },
    ...(mcKRW != null ? [{ k: t("info.marketCap"), v: fmtCapKRW(mcKRW) }] : []),
    ...(isKr && upper != null
      ? [
          {
            k: t("info.upperLimit"),
            v: money(upper),
            c: "var(--status-danger-fg)",
          },
        ]
      : []),
    ...(isKr && lower != null
      ? [{ k: t("info.lowerLimit"), v: money(lower), c: "var(--fg-brand)" }]
      : []),
    ...(info?.listDate ? [{ k: t("info.listDate"), v: info.listDate }] : []),
    ...(shares > 0
      ? [{ k: t("info.sharesOutstanding"), v: fmtShares(shares) }]
      : []),
    {
      k: t("info.tradingStatus"),
      // 거래정지는 토스 status(분류성 값)가 아니라 KRX 거래정지 플래그로 판정.
      v: info?.koreanMarketDetail?.krxTradingSuspended
        ? t("info.suspended")
        : t("info.normal"),
      c: info?.koreanMarketDetail?.krxTradingSuspended
        ? "var(--status-danger-fg)"
        : "var(--status-success-fg)",
    },
  ];
  return (
    <Card style={{ padding: 16 }}>
      <div
        style={{
          fontSize: 12.5,
          fontWeight: 700,
          color: "var(--fg-secondary)",
          marginBottom: 12,
        }}
      >
        {t("info.title")}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {rows.map((it, i) => (
          <div
            key={it.k}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "9px 0",
              borderTop: i === 0 ? 0 : "1px solid var(--border-subtle)",
            }}
          >
            <span style={{ fontSize: 12.5, color: "var(--fg-tertiary)" }}>
              {it.k}
            </span>
            <span
              className="num"
              style={{
                fontSize: "var(--text-label-sm)",
                fontWeight: 600,
                color: it.c ?? "var(--fg-primary)",
              }}
            >
              {it.v}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---- 종목 상세 본문 ------------------------------------------------------

function StockDetailBody({
  ticker,
  holding,
  watched,
  onToggleWatch,
  mobile,
}: {
  ticker: string;
  holding: TossHoldingsItem | null;
  watched: boolean;
  onToggleWatch: (marketCode?: string) => void;
  mobile: boolean;
}) {
  const { t } = useTranslation("stocks");
  // 종목 정체성: 마스터(이름·시장·통화) + 토스 종목정보 병행. 마스터에 없는 심볼(보유 이관 등)은 토스 정보로 폴백.
  const masterQ = useStockBySymbol(ticker);
  const infoQ = useTossStockInfo([ticker]);
  const pricesQ = useTossPrices([ticker]);
  const prevCloseQ = usePrevClose(ticker);
  const fxQ = useTossExchangeRate();
  const warningsQ = useTossStockWarnings(ticker);

  const master = masterQ.data ?? null;
  const info = infoQ.data?.[0];
  const name = master?.nameKr ?? info?.name ?? holding?.name ?? ticker;
  const currency =
    info?.currency ?? master?.currency ?? holding?.currency ?? "KRW";
  const countryCode = master?.countryCode ?? (currency === "USD" ? "US" : "KR");
  const isUs = currency === "USD";
  const warnings = warningsQ.data ?? [];

  const lastRaw = pricesQ.data?.[0]?.lastPrice;
  const last =
    lastRaw != null && Number.isFinite(Number.parseFloat(lastRaw))
      ? Number.parseFloat(lastRaw)
      : null;
  const fxRate = fxQ.data ? num(fxQ.data.rate) : null;
  // 등락률 = 토스 현재가 vs 전일 종가(일봉). 시세 미지원 종목은 배지를 숨긴다.
  const changePct = changePctOf(last, prevCloseQ.data);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 헤더: 종목명·관심 토글 */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <StockBadge
          name={name}
          symbol={ticker}
          countryCode={countryCode}
          size={46}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: "var(--fg-primary)",
              letterSpacing: "-0.01em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontSize: "var(--text-caption)",
              color: "var(--fg-tertiary)",
              marginTop: 3,
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            <span>{ticker}</span>
            <Badge variant="secondary">
              {master
                ? t(`market.${master.marketCode}`, {
                    defaultValue: master.marketCode,
                  })
                : (info?.market ?? "")}
            </Badge>
            <span>·</span>
            <span>
              {info?.securityType === "ETF" || master?.securityType === "ETF"
                ? "ETF"
                : t(`securityType.${master?.securityType ?? "STOCK"}`, {
                    defaultValue: t("info.stock"),
                  })}
            </span>
          </div>
        </div>
        <WatchStar
          watched={watched}
          onToggle={() => onToggleWatch(master?.marketCode)}
        />
      </div>

      {/* 현재가 (토스 prices — KR/US 만 제공. 그 외 시장은 미지원 안내) */}
      <div>
        <div
          className="num"
          style={{
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "var(--fg-primary)",
          }}
        >
          {last != null ? fmtByCurrency(last, currency) : "—"}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 2,
            flexWrap: "wrap",
          }}
        >
          {changePct != null && <PctBadge pct={changePct} size={14} />}
          {isUs && last != null && fxRate != null && (
            <span
              className="num"
              style={{
                fontSize: "var(--text-caption)",
                color: "var(--fg-tertiary)",
              }}
            >
              ≈ {money(Math.round(last * fxRate))}
            </span>
          )}
          {last == null && !pricesQ.isLoading && (
            <span
              style={{
                fontSize: "var(--text-caption)",
                color: "var(--fg-tertiary)",
              }}
            >
              {t("detail.priceUnavailable")}
            </span>
          )}
        </div>
      </div>

      {/* 매수 유의사항 (토스 warnings) */}
      {warnings.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {warnings.map((w, i) => (
            <span
              key={i}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: "var(--text-badge)",
                fontWeight: 700,
                padding: "4px 9px",
                borderRadius: "var(--radius-full)",
                background:
                  "color-mix(in oklab, var(--status-warning) 16%, var(--bg-surface))",
                color: "var(--status-warning-fg)",
              }}
            >
              <AlertTriangle size={12} strokeWidth={2.4} />
              {t(`warning.${w.warningType}`, { defaultValue: w.warningType })}
            </span>
          ))}
        </div>
      )}

      {/* 차트 (토스 candles) + 기간 세그먼트 */}
      <StockChartCard symbol={ticker} isUs={isUs} mobile={mobile} />

      {/* 내 보유 (보유 종목일 때) */}
      {holding &&
        (() => {
          const ev = num(holding.marketValue.amount);
          const pnl = num(holding.profitLoss.amount);
          const pnlPct = num(holding.profitLoss.rate);
          const avg = num(holding.averagePurchasePrice);
          const dayPnl = num(holding.dailyProfitLoss.amount);
          const purchase = num(holding.marketValue.purchaseAmount);
          const fees =
            num(holding.cost.commission) + num(holding.cost.tax ?? "0");
          const heldUs =
            holding.marketCountry.toUpperCase() === "US" ||
            holding.currency.toUpperCase() === "USD";
          const rows: Array<[string, React.ReactNode, string]> = [
            [
              t("holding.marketValue"),
              <MaskAmount card="stocks.detail" key="ev">
                {money(ev)}
              </MaskAmount>,
              "var(--fg-primary)",
            ],
            [
              t("holding.profitLoss"),
              <MaskAmount
                card="stocks.detail"
                key="pnl"
              >{`${pnl >= 0 ? "+" : "−"}${money(pnl, { abs: true })}`}</MaskAmount>,
              trendColor(pnl),
            ],
            [
              t("holding.quantity"),
              t("holding.sharesUnit", { count: holding.quantity }),
              "var(--fg-primary)",
            ],
            [
              t("holding.returnRate"),
              `${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%`,
              trendColor(pnl),
            ],
            [
              t("holding.dailyPnl"),
              <MaskAmount
                card="stocks.detail"
                key="day"
              >{`${dayPnl >= 0 ? "+" : "−"}${money(dayPnl, { abs: true })}`}</MaskAmount>,
              trendColor(dayPnl),
            ],
            [
              t("holding.avgPrice"),
              heldUs ? `$${avg.toFixed(2)}` : money(Math.round(avg)),
              "var(--fg-secondary)",
            ],
            [
              t("holding.purchaseAmount"),
              <MaskAmount card="stocks.detail" key="cost">
                {money(purchase)}
              </MaskAmount>,
              "var(--fg-secondary)",
            ],
            [t("holding.feesTax"), money(fees), "var(--fg-secondary)"],
            [
              t("holding.sellable"),
              t("holding.sharesUnit", { count: holding.quantity }),
              "var(--fg-secondary)",
            ],
          ];
          return (
            <Card style={{ padding: 16 }}>
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: "var(--fg-secondary)",
                  marginBottom: 12,
                }}
              >
                {t("holding.title")}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px 10px",
                }}
              >
                {rows.map(([k, v, c]) => (
                  <div key={k}>
                    <div
                      style={{
                        fontSize: "var(--text-badge)",
                        color: "var(--fg-tertiary)",
                        marginBottom: 2,
                      }}
                    >
                      {k}
                    </div>
                    <div
                      className="num"
                      style={{
                        fontSize: "var(--text-body-sm)",
                        fontWeight: 700,
                        color: c,
                      }}
                    >
                      {v}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })()}

      {/* 호가/체결 + 기본정보 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: mobile ? "1fr" : "1fr 1fr",
          gap: 16,
        }}
      >
        <QuotesCard
          symbol={ticker}
          currency={currency}
          lastPrice={last}
          changePct={changePct ?? 0}
        />
        <StockInfoCard
          symbol={ticker}
          currency={currency}
          info={info}
          lastPrice={last}
          fxRate={fxRate}
        />
      </div>

      {/* 일별 시세 */}
      <DailyQuoteTable symbol={ticker} currency={currency} />

      {/* 매매 (모의) — 매도=primary(파랑), 매수=destructive(빨강) — 국내 통념 */}
      <div style={{ display: "flex", gap: 10 }}>
        <Button
          variant="default"
          size="lg"
          style={{ flex: 1 }}
          onClick={() => toast.info(t("trade.sellToast", { name }))}
        >
          {t("trade.sell")}
        </Button>
        <Button
          variant="destructive"
          size="lg"
          style={{ flex: 1 }}
          onClick={() => toast.info(t("trade.buyToast", { name }))}
        >
          {t("trade.buy")}
        </Button>
      </div>

      {/* 수수료 안내 — 토스증권 Open API 기준 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 12px",
          background: "var(--bg-sunken)",
          borderRadius: "var(--radius-md)",
        }}
      >
        <Info size={14} color="var(--fg-tertiary)" style={{ flexShrink: 0 }} />
        <span
          style={{
            fontSize: "var(--text-badge)",
            color: "var(--fg-secondary)",
            lineHeight: 1.45,
          }}
        >
          {isUs ? t("fee.us") : t("fee.kr")}
        </span>
      </div>

      <div
        style={{
          fontSize: "var(--text-badge)",
          color: "var(--fg-tertiary)",
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        {t("disclaimer.line1")}
        <br />
        {t("disclaimer.line2")}
      </div>
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
export function TossStocksPage({ header }: { header?: React.ReactNode }) {
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
          {`${totalPnl >= 0 ? "+" : "−"}${money(totalPnl, { abs: true })} · ${totalPnlPct >= 0 ? "+" : ""}${totalPnlPct.toFixed(2)}% · ${t("holding.purchaseAmount")} ${money(totalCost)}`}
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
      sub: `${dailyPnlPct >= 0 ? "+" : ""}${dailyPnlPct.toFixed(2)}% · ${t("summary.holdingsCount")} ${t("unit.count", { count: holdingItems.length })}`,
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
          ? `${trendPct >= 0 ? "+" : ""}${trendPct.toFixed(2)}%`
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
          countryCode: "ALL",
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
        const heldUs =
          h.marketCountry.toUpperCase() === "US" ||
          h.currency.toUpperCase() === "USD";
        return (
          <StockRow
            mobile={mobile}
            key={h.symbol}
            stock={{
              symbol: h.symbol,
              name: h.name || h.symbol,
              countryCode: heldUs ? "US" : "KR",
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
                  {pnl >= 0 ? "+" : ""}
                  {pct.toFixed(2)}%
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
        subText={`${totalPnl >= 0 ? "+" : "−"}${money(totalPnl, { abs: true })} · ${totalPnlPct >= 0 ? "+" : ""}${totalPnlPct.toFixed(2)}%`}
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
