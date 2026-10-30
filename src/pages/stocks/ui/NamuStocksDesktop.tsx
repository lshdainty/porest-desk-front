import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router-dom";
import { Unplug } from "lucide-react";
import { MaskAmount } from "@/shared/lib/groo/hide-amounts";
import { formatChangeRate, money } from "@/shared/lib/groo/format";
import { Card } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { fmtByCurrency, num, trendColor } from "@/features/stock/lib/format";
import {
  donutSlices,
  krwValueOf,
  mergeNamuHoldings,
  type MergedHolding,
} from "@/features/stock/lib/holdings";
import { useNamuHoldings } from "@/features/stock/model/useNamu";
import {
  useSecuritiesExchangeRate,
  useSecuritiesPrices,
  WATCH_POLL_MS,
} from "@/features/stock/model/useSecuritiesPrices";
import { useWatchlist } from "@/features/stock/model/useWatchlist";
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
import {
  WatchlistPanel,
  type RowQuote,
} from "@/features/stock/ui/watchlist-panel";
import type { WatchGroup } from "@/features/stock/api/stockApi";
import { NamuStockDetail } from "./detail/NamuStockDetail";

interface OutletCtx {
  mobile: boolean;
}

/** 선택 상태 — 종목 심볼이거나 '전체 포트폴리오'(개요). */
const OVERVIEW = "__overview__" as const;

/** 목록에 보여줄 시장 필터. 국내/해외 축이 전폭 탭에서 여기로 내려왔다. */
type MarketFilter = "ALL" | "KRW" | "USD";

/**
 * 나무증권 본문 — 토스 화면과 **같은 골격**({@link StocksShell})을 쓴다.
 *
 * ## 국내/해외 전폭 탭을 없앴다
 *
 * 예전엔 화면 맨 위 전폭을 `국내 / 해외` 탭이 차지했다. 그건 사용자의 관심사가 아니라
 * **나무 엔드포인트가 둘로 갈린다는 서버 사정**이다(`?currency=KRW` 와 `?currency=USD` 가
 * 다른 호출). 화면에서 제일 좋은 자리를 서버 사정이 먹고 있었다.
 *
 * 이제 **둘 다 받아 한 목록으로 합친다**({@link mergeNamuHoldings}). 호출이 2회로 늘지만
 * 페이지 진입 시 1회씩이고 종목 수에 비례하지 않아 유량 제한과 무관하다. 통화를 나눠 보고
 * 싶으면 목록 안 필터 칩으로 거른다 — 축은 남기되 위계를 낮췄다.
 *
 * ## 증권사마다 다른 것만 여기 남는다
 *
 * - 랭킹·호가·체결·시장지표가 없다(나무 API 에 없다) → '발견' 탭과 호가 카드가 없다
 * - 지수·장운영 캘린더가 없다 → 상태 줄 왼쪽이 비고 출처만 남는다
 * - 나무 해외는 **미국(USD)만** 된다. 서버가 다른 통화를 400(`SEC_012`)으로 거절한다
 */
export function NamuStocksDesktop({
  header,
  initialSelected,
}: {
  header?: React.ReactNode;
  initialSelected?: string;
}) {
  const { t } = useTranslation("stocks");
  const { mobile } = useOutletContext<OutletCtx>();
  const [selected, setSelected] = useState<string | null>(
    initialSelected ?? null,
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [seg, setSeg] = useState<"holdings" | "watch">("holdings");
  const [market, setMarket] = useState<MarketFilter>("ALL");
  const [groupDialog, setGroupDialog] = useState<{
    open: boolean;
    group: WatchGroup | null;
  }>({ open: false, group: null });

  const watchlist = useWatchlist();

  // 국내·해외를 **둘 다** 받는다. 진입 시 1회씩이라 유량 제한과 무관하다.
  const krwQ = useNamuHoldings("KRW");
  const usdQ = useNamuHoldings("USD");
  // 환율은 증권사 무관 경로가 준다 — 서버가 잔고(1순위) → 시세(2순위) 순으로 구한다.
  const fxQ = useSecuritiesExchangeRate();
  const fxRate = fxQ.data?.rate ?? null;

  const view = useMemo(
    () => mergeNamuHoldings(krwQ.data, usdQ.data, fxRate),
    [krwQ.data, usdQ.data, fxRate],
  );

  const loading = krwQ.isLoading || usdQ.isLoading;
  // 둘 다 실패해야 오류다 — 한쪽만 실패하면 나머지는 보여준다(부분 표시는 통화별로 정확하다).
  const bothFailed = krwQ.isError && usdQ.isError;

  const visibleRows = useMemo(
    () =>
      market === "ALL"
        ? view.rows
        : view.rows.filter((r) => r.currency === market),
    [view.rows, market],
  );

  // 데스크톱: 기본 선택 = 첫 보유 종목. 보유가 없으면 개요를 띄운다(빈 안내문 대신).
  // 한 번 고르면 조건이 닫히므로 렌더 중에 맞춰도 반복되지 않는다.
  if (!mobile && !selected) {
    setSelected(view.rows.length > 0 ? view.rows[0]!.symbol : OVERVIEW);
  }

  // ---- 시세: 나무 유량 제한을 여기서 다룬다 --------------------------------
  //
  // ① 보유 목록은 **추가 호출을 하지 않는다.** 잔고 응답에 종목별 `currentPrice` 와
  //    `evalAmount` 가 이미 실려 온다. 행마다 시세를 다시 부르면 같은 값을 얻으려고
  //    N 콜을 더 내는 셈이다.
  // ② 관심목록만 시세가 필요하고, 그건 **서버 대리 조회 다건 경로**로 한 번에 묻는다.
  //    서버가 상한(50종목)·캐시(20초)·시간예산(4초)을 쥐고 있다.
  const watchSymbols = useMemo(
    () =>
      seg === "watch" && watchlist.activeGroup
        ? watchlist.activeGroup.items.map((i) => i.symbol)
        : [],
    [seg, watchlist.activeGroup],
  );
  const watchPricesQ = useSecuritiesPrices(watchSymbols, WATCH_POLL_MS);
  const watchQuotes = useMemo(() => {
    const map = new Map<string, RowQuote>();
    for (const q of watchPricesQ.data ?? []) {
      // 전일 종가는 나무가 시세 응답에 실어 준다 — 등락률을 캔들 없이 낸다.
      const changePct =
        q.previousClose != null && q.previousClose > 0
          ? ((q.price - q.previousClose) / q.previousClose) * 100
          : null;
      map.set(q.symbol, {
        price: Number.isFinite(q.price) ? q.price : null,
        changePct,
      });
    }
    return map;
  }, [watchPricesQ.data]);

  const selHolding =
    selected && selected !== OVERVIEW
      ? (view.rows.find((h) => h.symbol === selected) ?? null)
      : null;

  // ---- 1층: 요약 스트립 -----------------------------------------------------
  //
  // **있는 타일만 만든다.** 나무엔 '오늘 손익' 필드가 없고(잔고 응답에 일간 손익이 없다)
  // 지수도 없다. 그 자리를 `—` 로 남기면 로딩이 안 끝난 것처럼 보인다.
  const tiles: StatTile[] = [];
  if (view.krw) {
    tiles.push({
      id: "krw",
      hero: true,
      label: t("namu.domesticValue"),
      value: (
        <MaskAmount card="stocks.holdings">
          {fmtByCurrency(view.krw.evalAmount, "KRW")}
        </MaskAmount>
      ),
      sub: (
        <MaskAmount card="stocks.holdings">
          {`${view.krw.profitLoss >= 0 ? "+" : "−"}${fmtByCurrency(Math.abs(view.krw.profitLoss), "KRW")} · ${formatChangeRate(view.krw.profitRatePct, { sign: "always" })}`}
        </MaskAmount>
      ),
    });
  }
  if (view.usd) {
    tiles.push({
      id: "usd",
      hero: !view.krw,
      label: t("namu.overseasValue"),
      value: (
        <MaskAmount card="stocks.holdings">
          {fmtByCurrency(view.usd.evalAmount, "USD")}
        </MaskAmount>
      ),
      sub: (
        <MaskAmount card="stocks.holdings">
          {`${view.usd.profitLoss >= 0 ? "+" : "−"}${fmtByCurrency(Math.abs(view.usd.profitLoss), "USD")} · ${formatChangeRate(view.usd.profitRatePct, { sign: "always" })}`}
        </MaskAmount>
      ),
    });
  }
  if (view.count > 0) {
    tiles.push({
      id: "count",
      label: t("summary.holdingsCount"),
      value: t("unit.count", { count: view.count }),
      sub: t("namu.countSplit", {
        kr: view.krw?.count ?? 0,
        us: view.usd?.count ?? 0,
      }),
    });
  }
  // 원화 환산 합계 — **환율이 있고 통화가 섞였을 때만.** 환율을 못 받으면 이 타일이 사라진다
  // (부분합을 총액이라고 부르지 않는다).
  if (view.totalKrw != null && view.krw && view.usd) {
    tiles.push({
      id: "totalKrw",
      label: t("namu.krwTotal"),
      value: (
        <MaskAmount card="stocks.holdings">{`≈ ${money(Math.round(view.totalKrw))}`}</MaskAmount>
      ),
      sub: t("namu.fxApplied", {
        rate: Math.round(view.appliedFxRate ?? 0).toLocaleString(),
      }),
    });
  }
  if (fxRate != null && fxRate > 0) {
    tiles.push({
      id: "fx",
      label: t("summary.fxRate"),
      value: `₩${Math.round(fxRate).toLocaleString()}`,
      sub: t("namu.fxBase"),
    });
  }

  const strip =
    bothFailed || (!loading && view.count === 0 && tiles.length === 0) ? (
      <Card style={{ padding: mobile ? 18 : 22 }}>
        <div
          style={{
            fontSize: 12.5,
            color: "var(--fg-tertiary)",
            fontWeight: 600,
          }}
        >
          {t("summary.title")}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 8,
            color: "var(--fg-tertiary)",
            fontSize: "var(--text-body-sm)",
          }}
        >
          <Unplug size={16} />
          {bothFailed ? t("namu.holdingsError") : t("namu.holdingsEmpty")}
        </div>
      </Card>
    ) : (
      <SummaryStrip tiles={tiles} mobile={mobile} loading={loading} />
    );

  // ---- 2층: 상태 줄 — 나무는 왼쪽이 비고 출처만 남는다 -----------------------
  const statusLine = (
    <MarketStatusLine mobile={mobile} notice={t("namu.dataNotice")} />
  );

  // ---- 3층 좌: 목록 --------------------------------------------------------
  const marketFilter =
    view.krw && view.usd ? (
      <Tabs value={market} onValueChange={(v) => setMarket(v as MarketFilter)}>
        <TabsList variant="pill" size="sm">
          <TabsTrigger variant="pill" value="ALL">
            {t("namu.filterAll")}
          </TabsTrigger>
          <TabsTrigger variant="pill" value="KRW">
            {t("namu.tabDomestic")}
          </TabsTrigger>
          <TabsTrigger variant="pill" value="USD">
            {t("namu.tabOverseas")}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    ) : undefined;

  const holdingsList = loading ? (
    <Skeleton style={{ height: 140, borderRadius: "var(--radius-lg)" }} />
  ) : bothFailed ? (
    // 계좌가 없거나 조회가 막히면 화면을 비우지 않고 이유를 보여준다.
    <ListWrap mobile={mobile} fill={!mobile}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "32px 20px",
          color: "var(--fg-tertiary)",
          fontSize: "var(--text-label-sm)",
        }}
      >
        <Unplug size={16} />
        {t("namu.holdingsError")}
      </div>
    </ListWrap>
  ) : visibleRows.length === 0 ? (
    <ListWrap mobile={mobile} fill={!mobile}>
      <PanelEmpty
        msg={view.count === 0 ? t("namu.holdingsEmpty") : t("namu.filterEmpty")}
      />
    </ListWrap>
  ) : (
    <ListWrap mobile={mobile} fill={!mobile}>
      {/* 전체 포트폴리오 — 우측을 구성 도넛 + 비중 표로 바꾼다. */}
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
            <MaskAmount card="stocks.holdings">
              {view.totalKrw != null
                ? money(Math.round(view.totalKrw))
                : t("namu.fxUnavailableShort")}
            </MaskAmount>
          </div>
        }
      />
      {visibleRows.map((h) => (
        <NamuHoldingRow
          key={`${h.currency}:${h.symbol}`}
          item={h}
          mobile={mobile}
          active={selected === h.symbol}
          onClick={() => setSelected(h.symbol)}
        />
      ))}
    </ListWrap>
  );

  const list = (
    <ListPanel
      mobile={mobile}
      search={<StockSearchTrigger onClick={() => setSearchOpen(true)} />}
      segments={
        <Tabs
          value={seg}
          onValueChange={(v) => setSeg(v as "holdings" | "watch")}
        >
          <TabsList variant="pill" size="sm">
            <TabsTrigger variant="pill" value="holdings">
              {t("segments.holdings", { count: view.count })}
            </TabsTrigger>
            <TabsTrigger variant="pill" value="watch">
              {t("segments.watch", { count: watchlist.watchedSymbols.size })}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      }
      filter={seg === "holdings" ? marketFilter : undefined}
    >
      {seg === "holdings" ? (
        holdingsList
      ) : (
        <WatchlistPanel
          watchlist={watchlist}
          mobile={mobile}
          selected={selected}
          onSelect={setSelected}
          onEditGroup={(group) => setGroupDialog({ open: true, group })}
          priceOf={(sym) =>
            watchQuotes.get(sym) ?? { price: null, changePct: null }
          }
        />
      )}
    </ListPanel>
  );

  // ---- 3층 우: 상세 또는 개요 ------------------------------------------------
  const overviewRows: OverviewRow[] = view.rows.map((r) => {
    const ev = num(r.evalAmount);
    const pnl = num(r.profitLoss);
    const cost = ev - pnl;
    const krwValue = krwValueOf(r, view.appliedFxRate);
    return {
      symbol: `${r.currency}:${r.symbol}`,
      name: r.name || r.symbol,
      amountText: fmtByCurrency(ev, r.currency),
      weightPct:
        view.totalKrw != null && view.totalKrw > 0
          ? (krwValue / view.totalKrw) * 100
          : null,
      profitPct: cost > 0 ? (pnl / cost) * 100 : 0,
    };
  });

  const detailBody =
    selected === OVERVIEW || (selected == null && !mobile) ? (
      <PortfolioOverview
        mobile={mobile}
        title={t("portfolio.allTitle")}
        totalText={
          view.totalKrw != null ? money(Math.round(view.totalKrw)) : "—"
        }
        subText={view.fxMissing ? t("namu.fxUnavailable") : undefined}
        slices={donutSlices(view)}
        notice={view.fxMissing ? t("namu.donutNeedsFx") : undefined}
        rows={overviewRows}
      />
    ) : selected ? (
      <NamuStockDetail
        symbol={selected}
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

// ---- 보유 종목 행 ---------------------------------------------------------

/**
 * 보유 행. **시세를 따로 안 부른다** — 잔고 응답의 `currentPrice`·`evalAmount` 를 그대로 쓴다.
 * 행마다 `useNamuPrice` 를 걸면 나무는 종목마다 1콜이라 목록을 여는 것만으로 유량 제한에 걸린다.
 *
 * 통화가 섞인 목록이라 **행이 자기 통화를 밝힌다** — 금액 표기(`₩` / `$`)와 국가 뱃지 색으로.
 */
function NamuHoldingRow({
  item,
  mobile,
  active,
  onClick,
}: {
  item: MergedHolding;
  mobile: boolean;
  active: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation("stocks");
  const ev = num(item.evalAmount);
  const pnl = num(item.profitLoss);
  const qty = num(item.quantity);
  const cost = ev - pnl;
  const pct = cost > 0 ? (pnl / cost) * 100 : 0;
  return (
    <StockRow
      mobile={mobile}
      stock={{
        symbol: item.symbol,
        name: item.name || item.symbol,
        currency: item.currency,
      }}
      active={active}
      onClick={onClick}
      sub={t("holding.sharesHeld", { count: qty })}
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
            <MaskAmount card="stocks.holdings">
              {fmtByCurrency(ev, item.currency)}
            </MaskAmount>
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
}
