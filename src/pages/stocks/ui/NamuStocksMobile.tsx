import { isHardError } from "@/features/stock/lib/query-state";
import { useMemo, useState, type ReactNode } from "react";
import { amountText } from "@/features/stock/lib/amount-text";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { List } from "@/shared/ds/list";
import { ResultSection } from "@/shared/ds/result-section";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@/shared/ds/segmented-control";
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
import { fmtFxRate } from "@/features/stock/lib/format";
import { mergeNamuHoldings } from "@/features/stock/lib/holdings";
import { visibleSymbols } from "@/features/stock/lib/watch-prices";
import { useWatchGroups } from "@/features/stock/api/watchlistApi";
import type { WatchGroup } from "@/features/stock/api/stockApi";
import { useNamuHoldings } from "@/features/stock/model/useNamu";
import { useSecuritiesExchangeRate } from "@/features/stock/model/useSecuritiesPrices";
import { useVisibleIds } from "@/features/stock/model/useVisibleIds";
import { useNamuWatchQuotes } from "@/features/stock/model/useWatchQuotes";
import { InvestBand } from "@/features/stock/ui/phone/invest-band";
import { MarketBand } from "@/features/stock/ui/phone/market-band";
import {
  BandTitle,
  DeltaText,
  LineSkeletons,
  LineValue,
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
  namuHoldingLines,
  namuInvestSummary,
} from "../model/invest";

type Seg = "holdings" | "watch";
type MarketFilter = "ALL" | "KRW" | "USD";

const stockPath = (symbol: string) =>
  `${brokerPath("NAMU")}/${encodeURIComponent(symbol)}`;

/**
 * 나무증권 폰 화면(I-13 8 · 10) — 토스와 같은 띠 틀. 나무에 없는 것(지수 · 호가 · 발견 · 일간 손익)은 그리지 않는다.
 * 국내 · 해외 두 응답은 한 목록으로 합쳐 보이고, 통화를 나눠 보려면 목록 위 Segmented 로 거른다.
 */
export function NamuStocksMobile({ header }: { header?: ReactNode }) {
  const { t } = useTranslation("stocks");
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const seg: Seg = params.get("tab") === "watch" ? "watch" : "holdings";
  const setSeg = (next: Seg) =>
    setParams(
      (p) => {
        if (next === "holdings") p.delete("tab");
        else p.set("tab", next);
        return p;
      },
      { replace: true },
    );
  const [filter, setFilter] = useState<MarketFilter>("ALL");
  const open = (symbol: string) => navigate(stockPath(symbol));
  const mask = useMasked("stocks.holdings");

  // ---- 내 투자 ---------------------------------------------------------------
  const krwQ = useNamuHoldings("KRW");
  const usdQ = useNamuHoldings("USD");
  const fxQ = useSecuritiesExchangeRate();
  const fxRate = fxQ.data?.rate ?? null;
  const view = useMemo(
    () => mergeNamuHoldings(krwQ.data, usdQ.data, fxRate),
    [krwQ.data, usdQ.data, fxRate],
  );
  const summary = namuInvestSummary(view);
  const lines = useMemo(() => namuHoldingLines(view), [view]);
  const loading = krwQ.isLoading || usdQ.isLoading;
  // 둘 다 실패해야 오류다 — 한쪽만 실패하면 남은 통화만 보인다
  const bothFailed = isHardError(krwQ) && isHardError(usdQ);
  const retryInvest = () => {
    void krwQ.refetch();
    void usdQ.refetch();
  };

  const pctOf = (p: number) => formatChangeRate(Math.abs(p), { sign: "none" });
  const cur = (c: { currency: "KRW" | "USD"; evalAmount: number }) =>
    mask(amountText(c.evalAmount, c.currency));
  const pnlNode = (c: {
    currency: "KRW" | "USD";
    profitLoss: number;
    profitRatePct: number;
  }) => (
    <DeltaText
      dir={directionOf(c.profitLoss)}
      text={mask(
        `${amountText(Math.abs(c.profitLoss), c.currency)} · ${pctOf(c.profitRatePct)}`,
      )}
    />
  );

  // 지표 — 섞였고 환율이 있으면 원화 환산 합계, 아니면 있는 통화 하나(국내 먼저)
  const main =
    summary.mixed && summary.totalKrw != null
      ? ({ kind: "total" } as const)
      : summary.krw
        ? ({ kind: "krw" } as const)
        : summary.usd
          ? ({ kind: "usd" } as const)
          : null;
  const metric = (() => {
    if (main?.kind === "total")
      return {
        label: t("namu.krwTotal"),
        amount: mask(`≈ ${won(Math.round(summary.totalKrw!))}`),
        note: t("namu.fxApplied", {
          rate: Math.round(summary.appliedFxRate ?? 0).toLocaleString(),
        }),
      };
    const c = main?.kind === "usd" ? summary.usd! : summary.krw;
    if (!c)
      return {
        label: t("namu.domesticValue"),
        amount: mask(won(0)),
      };
    return {
      label:
        c.currency === "KRW"
          ? t("namu.domesticValue")
          : t("namu.overseasValue"),
      amount: cur(c),
      delta: {
        direction: directionOf(c.profitLoss),
        value: mask(
          `${amountText(Math.abs(c.profitLoss), c.currency)} · ${pctOf(c.profitRatePct)}`,
        ),
        text: t("invest.vsPurchase"),
      },
    };
  })();
  const investRows = [
    // 합계가 지표일 때는 두 통화를 줄로 풀어 보이고, 하나가 지표일 때는 다른 통화가 있으면 그것만 줄로
    ...(summary.krw && (main?.kind === "total" || main?.kind === "usd")
      ? [
          {
            key: "krw",
            name: t("namu.domesticValue"),
            value: (
              <LineValue
                amount={cur(summary.krw)}
                delta={pnlNode(summary.krw)}
              />
            ),
          },
        ]
      : []),
    ...(summary.usd && main?.kind !== "usd"
      ? [
          {
            key: "usd",
            name: t("namu.overseasValue"),
            value: (
              <LineValue
                amount={cur(summary.usd)}
                delta={pnlNode(summary.usd)}
              />
            ),
          },
        ]
      : []),
    {
      key: "count",
      name: t("summary.holdingsCount"),
      value: summary.mixed
        ? t("namu.countSplit", { kr: summary.krwCount, us: summary.usdCount })
        : t("unit.count", { count: summary.count }),
    },
  ];

  // ---- 종목 ------------------------------------------------------------------
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
  const quotes = useNamuWatchQuotes(quoteSymbols);
  const [form, setForm] = useState<{ group: WatchGroup | null } | null>(null);
  const [deleting, setDeleting] = useState<WatchGroup | null>(null);

  const shown =
    filter === "ALL" ? lines : lines.filter((l) => l.currency === filter);
  const holdingsList = loading ? (
    <LineSkeletons label={t("holdings.loading")} />
  ) : bothFailed ? (
    <BandFailure band title={t("holdings.failTitle")} onRetry={retryInvest} />
  ) : (
    <>
      {summary.mixed && (
        <div className="px-x6 pb-x2 pt-x1">
          <SegmentedControl
            aria-label={t("namu.filterAria")}
            value={filter}
            onValueChange={(v) => setFilter(v as MarketFilter)}
          >
            <SegmentedControlItem value="ALL">
              {t("namu.filterAll")}
            </SegmentedControlItem>
            <SegmentedControlItem value="KRW">
              {t("namu.tabDomestic")}
            </SegmentedControlItem>
            <SegmentedControlItem value="USD">
              {t("namu.tabOverseas")}
            </SegmentedControlItem>
          </SegmentedControl>
        </div>
      )}
      {shown.length === 0 ? (
        <ResultSection
          kind="empty"
          size="medium"
          as="h3"
          icon={<Search aria-hidden />}
          title={
            lines.length === 0 ? t("namu.holdingsEmpty") : t("namu.filterEmpty")
          }
        />
      ) : (
        <List aria-label={t("segments.holdings")}>
          {shown.map((l) => (
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
      )}
    </>
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
            label={metric.label}
            amount={metric.amount}
            delta={"delta" in metric ? metric.delta : undefined}
            note={"note" in metric ? metric.note : undefined}
            rows={investRows}
            loading={loading}
            failed={bothFailed}
            failDescription={t("namu.failDesc")}
            onRetry={retryInvest}
            emptyNote={
              !loading && !bothFailed && summary.count === 0
                ? t("namu.holdingsEmpty")
                : undefined
            }
            onOpenPortfolio={() => navigate(`${brokerPath("NAMU")}/portfolio`)}
          />
        </div>
        {fxRate != null && fxRate > 0 && (
          <div data-band="flush" data-section="market">
            <MarketBand
              markets={[]}
              indices={[]}
              fx={{ value: fmtFxRate(fxRate), base: t("namu.fxBase") }}
            />
          </div>
        )}
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
            </ChipTabsList>
          </Tabs>
          <div role="tabpanel" aria-labelledby="stocks-list-title">
            {seg === "holdings" ? (
              holdingsList
            ) : (
              <WatchGroups
                groups={groups}
                loading={watchQ.isLoading}
                failed={isHardError(watchQ)}
                onRetry={() => void watchQ.refetch()}
                priceOf={quotes.priceOf}
                track={track}
                onOpen={open}
                onAddGroup={() => setForm({ group: null })}
                onRenameGroup={(g) => setForm({ group: g })}
                onDeleteGroup={setDeleting}
              />
            )}
          </div>
          <SourceLine>{t("namu.dataNotice")}</SourceLine>
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
