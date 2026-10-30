import { useMemo, useState, type ReactNode } from "react";
import { amountText } from "@/features/stock/lib/amount-text";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { List } from "@/shared/ds/list";
import { ResultSection } from "@/shared/ds/result-section";
import { ChipTabsList, ChipTabsTrigger, Tabs } from "@/shared/ds/tabs";
import {
  TopNavigation,
  TopNavigationBackButton,
  TopNavigationTitle,
} from "@/shared/ds/top-navigation";
import { BandFailure } from "@/shared/ui/groo/band-parts";
import { ScreenBands } from "@/shared/ui/groo/screen-bands";
import { formatChangeRate } from "@/shared/lib/groo/format";
import { useMasked, won } from "@/shared/lib/groo/money-text";
import { brokerPath } from "@/features/stock/lib/broker";
import { fmtFxRate, num } from "@/features/stock/lib/format";
import { marketState } from "@/features/stock/lib/market-state";
import { visibleSymbols } from "@/features/stock/lib/watch-prices";
import { useWatchGroups } from "@/features/stock/api/watchlistApi";
import {
  useTossAccounts,
  useTossExchangeRate,
  useTossHoldings,
  useTossIndicatorCandles,
  useTossIndicatorPrices,
  useTossMarketCalendarKr,
  useTossMarketCalendarUs,
} from "@/features/stock/model/useTossStocks";
import { useTossWatchQuotes } from "@/features/stock/model/useWatchQuotes";
import { useVisibleIds } from "@/features/stock/model/useVisibleIds";
import type { WatchGroup } from "@/features/stock/api/stockApi";
import { InvestBand } from "@/features/stock/ui/phone/invest-band";
import {
  MarketBand,
  type IndexLine,
} from "@/features/stock/ui/phone/market-band";
import {
  BandTitle,
  DeltaText,
  LineSkeletons,
  SourceLine,
  StockLine,
} from "@/features/stock/ui/phone/phone-parts";
import { StockSearchEntry } from "@/features/stock/ui/phone/stock-search";
import {
  WatchGroupDeleteConfirm,
  WatchGroupForm,
  WatchGroups,
} from "@/features/stock/ui/phone/watch-groups";
import {
  directionOf,
  directionOfPct,
  tossHoldingLines,
  tossInvestSummary,
} from "../model/invest";
import { TossDiscoverMobile } from "./TossDiscoverMobile";

/** 지수로 세울 것 — 토스 카탈로그 8종 중 코스피 · 코스닥. 이름 키를 모르는 심볼은 그리지 않는다 */
const INDEX_SYMBOLS: string[] = ["KOSPI", "KOSDAQ"];

type Seg = "holdings" | "watch" | "discover";
const SEGS: Seg[] = ["holdings", "watch", "discover"];

const stockPath = (symbol: string) =>
  `${brokerPath("TOSS")}/${encodeURIComponent(symbol)}`;

/**
 * 토스증권 폰 화면(I-13 B) — 상단 바(← 증권) → (증권사 Line) → 띠 ① 내 투자 → 8 → 띠 ② 시장 → 8 → 띠 ③ 종목.
 * 종목 줄을 누르면 상세 페이지(`/desk/stocks/toss/:symbol`)로 간다. 탭은 `?tab=` 에 둬 돌아오면 그대로다.
 */
export function TossStocksMobile({ header }: { header?: ReactNode }) {
  const { t } = useTranslation("stocks");
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tabParam = params.get("tab");
  const seg: Seg = SEGS.includes(tabParam as Seg)
    ? (tabParam as Seg)
    : "holdings";
  const setSeg = (next: Seg) =>
    setParams(
      (p) => {
        if (next === "holdings") p.delete("tab");
        else p.set("tab", next);
        return p;
      },
      { replace: true },
    );
  const open = (symbol: string) => navigate(stockPath(symbol));
  const mask = useMasked("stocks.holdings");

  // ---- 내 투자 -----------------------------------------------------------
  const accountsQ = useTossAccounts();
  const accountSeq = accountsQ.data?.[0]?.accountSeq ?? null;
  const holdingsQ = useTossHoldings(accountSeq);
  const holdings = holdingsQ.data;
  // 계좌가 하나도 없는 응답이 빈 목록인지 오류인지 확인하지 못했다 — 실패 한 벌로 보인다(I-13 12)
  const investLoading =
    accountsQ.isLoading || (accountSeq != null && holdingsQ.isLoading);
  const investFailed =
    accountsQ.isError ||
    holdingsQ.isError ||
    (accountsQ.isSuccess && accountSeq == null);
  const retryInvest = () => {
    void accountsQ.refetch();
    if (accountSeq != null) void holdingsQ.refetch();
  };
  const fxQ = useTossExchangeRate();
  const fxRate = fxQ.data ? num(fxQ.data.rate) : null;
  const summary = holdings ? tossInvestSummary(holdings) : null;
  const lines = useMemo(
    () => (holdings ? tossHoldingLines(holdings.items, fxRate) : []),
    [holdings, fxRate],
  );

  const pctOf = (p: number) => formatChangeRate(Math.abs(p), { sign: "none" });
  const investDelta = summary && {
    direction: directionOf(summary.pnl),
    value: mask(`${won(Math.abs(summary.pnl))} · ${pctOf(summary.pnlPct)}`),
    text: t("invest.vsPurchase"),
  };
  const dailyDir = summary ? directionOfPct(summary.dailyPnlPct) : "flat";
  const investRows = [
    {
      key: "purchase",
      name: t("holding.purchaseAmount"),
      value: mask(won(summary?.purchaseAmount ?? 0)),
    },
    {
      key: "daily",
      name: t("holding.dailyPnl"),
      value: (
        <DeltaText
          strong
          dir={dailyDir}
          text={mask(
            `${won(Math.abs(summary?.dailyPnl ?? 0))} · ${pctOf(summary?.dailyPnlPct ?? 0)}`,
          )}
        />
      ),
    },
    {
      key: "count",
      name: t("summary.holdingsCount"),
      value: t("unit.count", { count: summary?.count ?? 0 }),
    },
  ];

  // ---- 시장 ----------------------------------------------------------------
  const idxQ = useTossIndicatorPrices(INDEX_SYMBOLS);
  const idxCandles = useTossIndicatorCandles(INDEX_SYMBOLS);
  const krQ = useTossMarketCalendarKr();
  const usQ = useTossMarketCalendarUs();
  const kr = marketState(
    krQ.data?.today.integrated?.regularMarket,
    "Asia/Seoul",
  );
  const us = marketState(usQ.data?.today.regularMarket, "America/New_York");
  const states = [
    { key: "kr", name: t("market.krShort"), ...kr },
    { key: "us", name: t("market.usShort"), ...us },
  ].map((m) => ({
    key: m.key,
    name: m.name,
    open: m.open,
    label: t(m.labelKey, m.time ? { time: m.time } : undefined),
  }));
  const indices: IndexLine[] = [];
  for (const i of idxQ.data ?? []) {
    // 이름 키가 없는 심볼은 "코스닥" 으로 접지 않고 그리지 않는다(I-13 9)
    if (!t(`market.${i.symbol}`, { defaultValue: "" })) continue;
    if (num(i.lastPrice) <= 0) continue;
    const series = idxCandles.get(i.symbol);
    const trendPct =
      series && series.length >= 2 && series[0]! > 0
        ? ((series[series.length - 1]! - series[0]!) / series[0]!) * 100
        : null;
    indices.push({
      symbol: i.symbol,
      name: t(`market.${i.symbol}`),
      value: num(i.lastPrice).toLocaleString(undefined, {
        maximumFractionDigits: 2,
      }),
      series,
      trendPct,
    });
  }
  const marketFailed =
    idxQ.isError && krQ.isError && usQ.isError && fxQ.isError;

  // ---- 종목 ----------------------------------------------------------------
  const watchQ = useWatchGroups();
  const groups = useMemo(() => watchQ.data ?? [], [watchQ.data]);
  const { visibleIds, track, allVisible } = useVisibleIds();
  const quoteSymbols = useMemo(
    () =>
      seg === "watch"
        ? visibleSymbols(
            groups,
            allVisible ? new Set(groups.map((g) => g.rowId)) : visibleIds,
          )
        : [],
    [seg, groups, visibleIds, allVisible],
  );
  const quotes = useTossWatchQuotes(quoteSymbols);

  const [form, setForm] = useState<{ group: WatchGroup | null } | null>(null);
  const [deleting, setDeleting] = useState<WatchGroup | null>(null);

  const holdingsList = investLoading ? (
    <LineSkeletons label={t("holdings.loading")} />
  ) : investFailed ? (
    <BandFailure band title={t("holdings.failTitle")} onRetry={retryInvest} />
  ) : lines.length === 0 ? (
    <ResultSection
      kind="empty"
      size="medium"
      as="h3"
      icon={<Search aria-hidden />}
      title={t("holdings.empty")}
    />
  ) : (
    <List aria-label={t("segments.holdings")}>
      {lines.map((l) => (
        <StockLine
          key={l.key}
          name={l.name}
          detail={t("holding.lineDesc", {
            code: l.symbol,
            count: l.qty.toLocaleString(),
          })}
          amount={mask(amountText(l.value, l.currency))}
          pct={l.returnPct}
          onClick={() => open(l.symbol)}
        />
      ))}
    </List>
  );

  return (
    <>
      <TopNavigation type="standard">
        <TopNavigationBackButton fallbackHref="/desk/more" />
        <TopNavigationTitle>{t("nav.title")}</TopNavigationTitle>
      </TopNavigation>
      {header}
      <ScreenBands>
        <div data-band="flush" data-section="invest">
          <InvestBand
            label={t("summary.title")}
            amount={mask(won(summary?.evalAmount ?? 0))}
            delta={investDelta ?? undefined}
            rows={investRows}
            loading={investLoading}
            failed={investFailed}
            onRetry={retryInvest}
            onOpenPortfolio={() => navigate(`${brokerPath("TOSS")}/portfolio`)}
          />
        </div>
        <div data-band="flush" data-section="market">
          <MarketBand
            markets={states}
            indices={indices}
            fx={
              fxRate != null && fxRate > 0
                ? { value: fmtFxRate(fxRate), base: t("market.fxBase") }
                : null
            }
            loading={idxQ.isLoading}
            failed={marketFailed}
            onRetry={() => {
              void idxQ.refetch();
              void fxQ.refetch();
            }}
          />
        </div>
        <div data-band="flush" data-section="stocks">
          <BandTitle id="stocks-list-title">{t("list.title")}</BandTitle>
          <StockSearchEntry
            className="px-x6 pt-x2"
            onPick={(item) => open(item.symbol)}
          />
          <Tabs value={seg} onValueChange={(v) => setSeg(v as Seg)}>
            <ChipTabsList
              variant="solid"
              size="medium"
              aria-label={t("list.tabsAria")}
            >
              <ChipTabsTrigger value="holdings">
                {t("segments.holdings")}
              </ChipTabsTrigger>
              <ChipTabsTrigger value="watch">
                {t("segments.watch")}
              </ChipTabsTrigger>
              <ChipTabsTrigger value="discover">
                {t("segments.discover")}
              </ChipTabsTrigger>
            </ChipTabsList>
          </Tabs>
          <div role="tabpanel" aria-labelledby="stocks-list-title">
            {seg === "holdings" ? (
              holdingsList
            ) : seg === "watch" ? (
              <WatchGroups
                groups={groups}
                loading={watchQ.isLoading}
                failed={watchQ.isError}
                onRetry={() => void watchQ.refetch()}
                priceOf={quotes.priceOf}
                track={track}
                onOpen={open}
                onAddGroup={() => setForm({ group: null })}
                onRenameGroup={(g) => setForm({ group: g })}
                onDeleteGroup={setDeleting}
              />
            ) : (
              <TossDiscoverMobile onOpen={open} />
            )}
          </div>
          <SourceLine>{t("market.dataNotice")}</SourceLine>
        </div>
      </ScreenBands>
      {form && (
        <WatchGroupForm group={form.group} onClose={() => setForm(null)} />
      )}
      {deleting && (
        <WatchGroupDeleteConfirm
          group={deleting}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}
