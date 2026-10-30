import { isHardError } from "@/features/stock/lib/query-state";
import { useId, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LineChart, Star } from "lucide-react";
import { Badge } from "@/shared/ds/badge";
import { BottomSheet, BottomSheetContent } from "@/shared/ds/bottom-sheet";
import { Button } from "@/shared/ds/button";
import { Callout } from "@/shared/ds/callout";
import { withCommaBreaks } from "@/shared/ds/i18n";
import { List, ListButtonItem, ListItem } from "@/shared/ds/list";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@/shared/ds/segmented-control";
import { Skeleton } from "@/shared/ds/skeleton";
import { TopNavigationIconButton } from "@/shared/ds/top-navigation";
import { cn } from "@/shared/lib/cn";
import { formatMonthDay } from "@/shared/lib/date";
import { BandFailure } from "@/shared/ui/groo/band-parts";
import { fmtByCurrency } from "@/features/stock/lib/format";
import { formatChangeRate } from "@/shared/lib/groo/format";
import { tradeClock } from "@/features/stock/lib/market-state";
import { useWatchlist } from "@/features/stock/model/useWatchlist";
import {
  useTossOrderbook,
  useTossTrades,
} from "@/features/stock/model/useTossStocks";
import { useDailyCandles } from "@/features/stock/model/useDailyCandles";
import { LightweightStockChart } from "@/features/stock/ui/LightweightStockChart";
import {
  RANGES,
  RANGE_LABEL_KEY,
  useCandleAvailability,
  type Range,
} from "@/features/stock/model/chart-range";
import {
  BandTitle,
  DeltaText,
  KvListItem,
  PctDelta,
} from "@/features/stock/ui/phone/phone-parts";

/*
 * 폰 종목 상세 페이지의 조각(I-13 18 ~ 20) — 머리 · 관심 Toggle · 차트 · 키-값 · 호가 · 일별 시세 · 매매.
 * 증권사 무관한 것만 둔다. 금액은 글로 만들어 받는다(가리기 · 통화 반영은 부르는 쪽).
 */

/** 상단 바 오른쪽 관심 Toggle — 이름 고정 "관심 등록", 눌림은 aria-pressed(켬 선 2.5 · 끔 선 2). 그룹이 둘 이상이면 담을 그룹을 고른다(Q3) */
export function WatchToggle({
  symbol,
  marketCode,
}: {
  symbol: string;
  marketCode?: string;
}) {
  const { t } = useTranslation("stocks");
  const wl = useWatchlist();
  const [picking, setPicking] = useState(false);
  const watched = wl.isWatched(symbol);
  const onPress = () => {
    if (!watched && wl.groups.length > 1) setPicking(true);
    else wl.toggleWatch(symbol, marketCode);
  };
  return (
    <>
      <TopNavigationIconButton
        aria-label={t("watch.add")}
        aria-pressed={watched}
        aria-disabled={!wl.ready && !wl.failed ? true : undefined}
        onClick={onPress}
      >
        <Star aria-hidden strokeWidth={watched ? 2.5 : 2} />
      </TopNavigationIconButton>
      <BottomSheet open={picking} onOpenChange={setPicking}>
        <BottomSheetContent title={t("watch.pickGroup")}>
          <List aria-label={t("watch.pickGroup")}>
            {wl.groups.map((g) => (
              <ListButtonItem
                key={g.rowId}
                title={g.groupName}
                detail={t("unit.count", { count: g.items.length })}
                onClick={() => {
                  setPicking(false);
                  wl.toggleWatch(symbol, marketCode, g.rowId);
                }}
              />
            ))}
          </List>
        </BottomSheetContent>
      </BottomSheet>
    </>
  );
}

/** 띠 ① 머리 · 차트 — 위 24 · 좌우 24 · 아래 24 */
export function HeadBand({
  name,
  detail,
  priceText,
  pct,
  changeAmount,
  currency,
  approx,
  unavailable,
  failed,
  onRetry,
  warnings,
  loading,
  symbol,
  isUs,
}: {
  name: string;
  detail: string;
  priceText: string;
  pct: number | null;
  /** 전일 종가 대비 변화 금액(부호 있음) — 머리 증감 "▲ 45,200원 · 0.30%". 없으면 퍼센트만 */
  changeAmount?: number | null;
  currency?: string;
  approx?: string;
  unavailable?: string;
  /** 시세 조회가 실패했다(받아 둔 값 없음) — "미지원" 이 아니라 실패 한 벌 + 다시 시도(검수 H4) */
  failed?: boolean;
  onRetry?: () => void;
  warnings?: string[];
  loading?: boolean;
  symbol: string;
  isUs: boolean;
}) {
  const { t } = useTranslation("stocks");
  return (
    <section aria-labelledby="stock-name">
      <h2
        id="stock-name"
        className="m-0 text-t7 font-bold text-fg-neutral [overflow-wrap:break-word]"
      >
        {name}
      </h2>
      <p className="m-0 mt-x0_5 text-t3 text-fg-neutral-subtle">{detail}</p>
      <div className="mt-x4">
        {loading ? (
          <Skeleton text="t12" className="w-3/5" />
        ) : (
          <p className="m-0 text-t12 font-bold tabular-nums text-fg-neutral">
            {withCommaBreaks(priceText)}
          </p>
        )}
        {pct != null && (
          <div className="mt-x1">
            {changeAmount != null && currency ? (
              <DeltaText
                dir={Math.abs(pct) < 0.005 ? "flat" : pct > 0 ? "up" : "down"}
                text={`${fmtByCurrency(Math.abs(changeAmount), currency)} · ${formatChangeRate(Math.abs(pct), { sign: "none" })}`}
              />
            ) : (
              <PctDelta pct={pct} />
            )}
          </div>
        )}
        {approx && (
          <p className="m-0 mt-x1 text-t3 tabular-nums text-fg-neutral-subtle">
            {approx}
          </p>
        )}
        {failed ? (
          <BandFailure
            title={t("detail.priceFail")}
            onRetry={onRetry ?? (() => {})}
          />
        ) : (
          unavailable && (
            <p className="m-0 mt-x1 text-t3 text-fg-neutral-subtle">
              {unavailable}
            </p>
          )
        )}
      </div>
      {warnings && warnings.length > 0 && (
        <div className="mt-x2 flex flex-wrap gap-x1">
          {warnings.map((w, i) => (
            <Badge key={i} variant="weak" tone="warning" size="medium">
              {w}
            </Badge>
          ))}
        </div>
      )}
      <ChartBlock symbol={symbol} isUs={isUs} />
    </section>
  );
}

/** 차트(05-1 그대로 · 높이 168) + 기간 Segmented 5칸(식별자는 `1D` 그대로, 글만 "1일") */
function ChartBlock({ symbol, isUs }: { symbol: string; isUs: boolean }) {
  const { t } = useTranslation("stocks");
  const [range, setRange] = useState<Range>("1D");
  const availability = useCandleAvailability();
  return (
    <div className="mt-x4">
      <div style={{ height: 168 }}>
        {availability === "yes" ? (
          <LightweightStockChart
            symbol={symbol}
            isUs={isUs}
            range={range}
            height={168}
          />
        ) : availability === "no" ? (
          <div className="flex h-full flex-col items-center justify-center gap-x2 text-center text-t4 text-fg-neutral-subtle">
            <LineChart aria-hidden className="size-7" />
            {t("chart.brokerRequired")}
          </div>
        ) : null}
      </div>
      {availability !== "no" && (
        <SegmentedControl
          className="mt-x3"
          aria-label={t("chart.rangeAria")}
          value={range}
          onValueChange={(v) => setRange(v as Range)}
        >
          {RANGES.map((r) => (
            <SegmentedControlItem key={r} value={r} className="px-x1">
              {t(RANGE_LABEL_KEY[r])}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      )}
    </div>
  );
}

export interface KvLine {
  key: string;
  name: string;
  value: ReactNode;
  tone?: "critical" | "positive" | "informative";
}

/** 키-값 띠 — 구역 제목 + 한 줄에 하나(키 R9 t4 · 값 오른쪽 R13 t5 · 700 · 고정폭) */
export function KvBand({
  title,
  id,
  rows,
  loading,
}: {
  title: string;
  id: string;
  rows: KvLine[];
  loading?: boolean;
}) {
  return (
    <section aria-labelledby={id}>
      <BandTitle id={id}>{title}</BandTitle>
      <List aria-labelledby={id} className="pb-x6">
        {rows.map((r) => (
          <KvListItem
            key={r.key}
            name={r.name}
            value={r.value}
            tone={r.tone}
            loading={loading}
          />
        ))}
      </List>
    </section>
  );
}

// ---- 호가 · 체결 ---------------------------------------------------------------

const ROW = "h-8";
const num = (s: string) => Number.parseFloat(s);

/** 호가 · 체결 띠 — Segmented [호가, 체결] + 위 12 에 표(`<table>`, 줄 32). 매도 informative · 매수 critical */
export function QuotesBand({
  symbol,
  currency,
  lastPrice,
  changePct,
}: {
  symbol: string;
  currency: string;
  lastPrice: number | null;
  /** 전일 종가를 못 받았으면 null — 가운데 띠에 등락률을 지어내지 않는다(0.00% 금지) */
  changePct: number | null;
}) {
  const { t } = useTranslation("stocks");
  const [tab, setTab] = useState<"book" | "tape">("book");
  const bookQ = useTossOrderbook(symbol);
  const tradesQ = useTossTrades(symbol);
  const fmt = (p: number) => fmtByCurrency(p, currency);
  const asks = useMemo(
    () =>
      (bookQ.data?.asks ?? [])
        .slice(0, 5)
        .map((e) => ({ p: num(e.price), q: Math.round(num(e.volume)) }))
        .reverse(),
    [bookQ.data],
  );
  const bids = useMemo(
    () =>
      (bookQ.data?.bids ?? [])
        .slice(0, 5)
        .map((e) => ({ p: num(e.price), q: Math.round(num(e.volume)) })),
    [bookQ.data],
  );
  const maxQ = Math.max(1, ...asks.map((a) => a.q), ...bids.map((b) => b.q));
  const fills = (tradesQ.data ?? []).slice(0, 12).map((x, i, arr) => {
    const p = num(x.price);
    const prev = i + 1 < arr.length ? num(arr[i + 1]!.price) : p;
    return {
      time: tradeClock(x.timestamp),
      p,
      q: Math.round(num(x.volume)),
      dir: p >= prev ? 1 : -1,
    };
  });

  const head = (cols: string[]) => (
    <thead>
      <tr className="text-t3 font-medium text-fg-neutral-subtle">
        {cols.map((c, i) => (
          <th
            key={c}
            scope="col"
            className={cn(
              "whitespace-nowrap px-x1 pb-x1 font-medium first:pl-0 last:pr-0",
              i === 0 ? "text-start" : "text-end",
              cols.length === 3 && i === 1 && "text-center",
            )}
          >
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
  const bookRow = (e: { p: number; q: number }, side: "ask" | "bid") => (
    <tr key={`${side}${e.p}`} className={ROW}>
      <td className="relative p-0">
        {side === "bid" && (
          <>
            <span
              aria-hidden
              className="absolute inset-y-x1 right-0 rounded-[4px] bg-bg-critical-weak"
              style={{ width: `${(e.q / maxQ) * 100}%` }}
            />
            <span className="relative block pr-x1_5 text-end text-t3 tabular-nums text-fg-neutral-subtle">
              {e.q.toLocaleString()}
            </span>
          </>
        )}
      </td>
      <td
        className={cn(
          "whitespace-nowrap px-x1 text-center text-t4 font-bold tabular-nums",
          side === "ask" ? "text-fg-informative" : "text-fg-critical",
        )}
      >
        {fmt(e.p)}
      </td>
      <td className="relative p-0">
        {side === "ask" && (
          <>
            <span
              aria-hidden
              className="absolute inset-y-x1 left-0 rounded-[4px] bg-bg-informative-weak"
              style={{ width: `${(e.q / maxQ) * 100}%` }}
            />
            <span className="relative block pl-x1_5 text-t3 tabular-nums text-fg-neutral-subtle">
              {e.q.toLocaleString()}
            </span>
          </>
        )}
      </td>
    </tr>
  );

  return (
    <section aria-labelledby="stock-quotes">
      <BandTitle id="stock-quotes">{t("quotes.title")}</BandTitle>
      <div className="px-x6 pb-x6 pt-x1">
        <SegmentedControl
          aria-label={t("quotes.title")}
          value={tab}
          onValueChange={(v) => setTab(v as "book" | "tape")}
        >
          <SegmentedControlItem value="book">
            {t("quotes.orderbook")}
          </SegmentedControlItem>
          <SegmentedControlItem value="tape">
            {t("quotes.trades")}
          </SegmentedControlItem>
        </SegmentedControl>
        <div className="mt-x3">
          {tab === "book" ? (
            bookQ.isLoading ? (
              <TableSkeleton label={t("quotes.orderbookLoading")} />
            ) : isHardError(bookQ) ? (
              <BandFailure
                title={t("quotes.orderbookFail")}
                onRetry={() => void bookQ.refetch()}
              />
            ) : asks.length === 0 && bids.length === 0 ? (
              <p className="m-0 py-x3 text-center text-t3 text-fg-neutral-subtle">
                {t("quotes.orderbookEmpty")}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <caption className="sr-only">{t("quotes.orderbook")}</caption>
                  {head([
                    t("orderbook.bidVolume"),
                    t("quotes.tradePrice"),
                    t("orderbook.askVolume"),
                  ])}
                  <tbody>
                    {asks.map((a) => bookRow(a, "ask"))}
                    <tr className={ROW}>
                      <td
                        colSpan={3}
                        className="border-y border-dashed border-stroke-neutral-subtle p-0 text-center"
                      >
                        <span
                          className={cn(
                            "text-t4 font-bold tabular-nums",
                            changePct == null || changePct === 0
                              ? "text-fg-neutral"
                              : changePct > 0
                                ? "text-fg-critical"
                                : "text-fg-informative",
                          )}
                        >
                          {lastPrice != null ? fmt(lastPrice) : "—"}
                        </span>
                        {changePct != null && (
                          <>
                            {" "}
                            <PctDelta pct={changePct} />
                          </>
                        )}
                      </td>
                    </tr>
                    {bids.map((b) => bookRow(b, "bid"))}
                  </tbody>
                </table>
              </div>
            )
          ) : tradesQ.isLoading ? (
            <TableSkeleton label={t("quotes.tradesLoading")} />
          ) : isHardError(tradesQ) ? (
            <BandFailure
              title={t("quotes.tradesFail")}
              onRetry={() => void tradesQ.refetch()}
            />
          ) : fills.length === 0 ? (
            <p className="m-0 py-x3 text-center text-t3 text-fg-neutral-subtle">
              {t("quotes.tradesEmpty")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <caption className="sr-only">{t("quotes.trades")}</caption>
                {head([
                  t("quotes.tradeTime"),
                  t("quotes.tradePrice"),
                  t("quotes.tradeVolume"),
                ])}
                <tbody>
                  {fills.map((f, i) => (
                    <tr key={i} className={ROW}>
                      <td className="p-0 text-t3 tabular-nums text-fg-neutral-subtle">
                        {f.time}
                      </td>
                      <td
                        className={cn(
                          "p-0 text-end text-t4 font-bold tabular-nums",
                          f.dir > 0
                            ? "text-fg-critical"
                            : "text-fg-informative",
                        )}
                      >
                        {fmt(f.p)}
                      </td>
                      <td className="p-0 text-end text-t3 tabular-nums text-fg-neutral-muted">
                        {f.q.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function TableSkeleton({ label }: { label: string }) {
  return (
    <div aria-busy aria-label={label} className="flex flex-col gap-x2">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-6 w-full" />
      ))}
    </div>
  );
}

// ---- 일별 시세 + 매매 ------------------------------------------------------------

/** 일별 시세 띠 — List 줄: 제목 날짜 "10월 23일" · 설명 "거래량 …" · 오른쪽 종가 + 등락률. `tail` 은 끝에 오는 매매(토스) */
export function DailyBand({
  symbol,
  currency,
  tail,
}: {
  symbol: string;
  currency: string;
  tail?: ReactNode;
}) {
  const { t } = useTranslation("stocks");
  const q = useDailyCandles(symbol);
  const rows = useMemo(() => {
    const asc = [...(q.data?.candles ?? [])].sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp),
    );
    const recent = asc.slice(-9);
    const out: {
      date: string;
      close: number;
      chg: number;
      vol: number;
    }[] = [];
    for (let i = recent.length - 1; i >= 1; i--) {
      const c = recent[i]!;
      const prev = num(recent[i - 1]!.closePrice);
      const close = num(c.closePrice);
      out.push({
        date: c.timestamp.slice(0, 10),
        close,
        chg: prev > 0 ? ((close - prev) / prev) * 100 : 0,
        vol: Math.round(num(c.volume)),
      });
    }
    return out.slice(0, 8);
  }, [q.data]);
  return (
    <section aria-labelledby="stock-daily" className="pb-x6">
      <BandTitle id="stock-daily">{t("daily.title")}</BandTitle>
      {q.isLoading ? (
        <List aria-busy aria-label={t("daily.loading")}>
          {Array.from({ length: 5 }, (_, i) => (
            <ListItem
              key={i}
              title={<Skeleton text="t5" className="w-1/4" />}
              detail={<Skeleton text="t3" className="mt-x0_5 w-1/3" />}
              suffix={<Skeleton text="t5" className="w-20" />}
            />
          ))}
        </List>
      ) : isHardError(q) ? (
        <BandFailure
          band
          title={t("daily.failTitle")}
          onRetry={() => void q.refetch()}
        />
      ) : rows.length === 0 ? (
        <p className="m-0 px-x6 py-x3 text-center text-t3 text-fg-neutral-subtle">
          {t("daily.empty")}
        </p>
      ) : (
        <List aria-labelledby="stock-daily">
          {rows.map((r) => (
            <ListItem
              key={r.date}
              title={formatMonthDay(new Date(`${r.date}T00:00:00`))}
              detail={t("daily.volumeDesc", { count: r.vol.toLocaleString() })}
              suffix={
                <span className="flex flex-col items-end">
                  <span className="text-end text-t5 font-bold tabular-nums text-fg-neutral">
                    {withCommaBreaks(fmtByCurrency(r.close, currency))}
                  </span>
                  <span className="mt-x0_5">
                    <PctDelta pct={r.chg} />
                  </span>
                </span>
              }
            />
          ))}
        </List>
      )}
      {tail}
    </section>
  );
}

/**
 * 매도 · 매수(국내 통념 — 매도 brandSolid · 매수 criticalSolid, large 48 한 줄 반씩 · 사이 8) + 이유 줄 + 수수료 Callout + 안내 두 줄.
 * 주문은 아직 없다 — 사용자 결정 D3 B(10-30): 가짜 완료 · "준비중" 띠를 걷고, 단추는 남기되 막고(disabled — 색은 스펙의 비활성 전용 색)
 * 그 밑에 이유 줄 "주문은 곧 열려요." 를 둔다. 막힌 단추는 이유 줄을 aria-describedby 로 이어 읽힌다.
 */
export function TradeTail({ isUs }: { isUs: boolean }) {
  const { t } = useTranslation("stocks");
  const reasonId = useId();
  return (
    <div className="px-x6 pt-x5">
      <div className="flex gap-x2">
        <Button
          variant="brandSolid"
          size="large"
          className="flex-1"
          disabled
          aria-describedby={reasonId}
        >
          {t("trade.sell")}
        </Button>
        <Button
          variant="criticalSolid"
          size="large"
          className="flex-1"
          disabled
          aria-describedby={reasonId}
        >
          {t("trade.buy")}
        </Button>
      </div>
      <Callout id={reasonId} tone="neutral" className="mt-x3">
        {t("trade.pending")}
      </Callout>
      <Callout tone="informative" className="mt-x3">
        {isUs ? t("fee.us") : t("fee.kr")}
      </Callout>
      <p className="m-0 mt-x3 text-center text-t3 text-fg-neutral-subtle">
        {t("disclaimer.line1")}
        <br />
        {t("disclaimer.line2")}
      </p>
    </div>
  );
}

/** 나무 상세 아래 안내 — 둘째 줄(시세는 참고용)만. 첫 증권사 문구를 띄우지 않는다(I-13 21) */
export function NamuNotice() {
  const { t } = useTranslation("stocks");
  return (
    <p className="m-0 px-x6 pt-x5 text-center text-t3 text-fg-neutral-subtle">
      {t("disclaimer.line2")}
    </p>
  );
}
