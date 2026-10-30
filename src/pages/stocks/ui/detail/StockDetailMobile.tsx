import { useTranslation } from "react-i18next";
import {
  TopNavigation,
  TopNavigationActions,
  TopNavigationBackButton,
  TopNavigationTitle,
} from "@/shared/ds/top-navigation";
import { ScreenBands } from "@/shared/ui/groo/screen-bands";
import { formatChangeRate, money } from "@/shared/lib/groo/format";
import { useMasked, won } from "@/shared/lib/groo/money-text";
import { brokerPath } from "@/features/stock/lib/broker";
import { marketName } from "@/features/stock/lib/market-name";
import { formatDateLong } from "@/shared/lib/date";
import {
  fmtByCurrency,
  fmtCapKRW,
  fmtShares,
  num,
} from "@/features/stock/lib/format";
import { mergeNamuHoldings } from "@/features/stock/lib/holdings";
import { useNamuHoldings } from "@/features/stock/model/useNamu";
import {
  useSecuritiesExchangeRate,
  useSecuritiesPrices,
  WATCH_POLL_MS,
} from "@/features/stock/model/useSecuritiesPrices";
import { useStockBySymbol } from "@/features/stock/model/useStockMaster";
import {
  changePctOf,
  usePrevClose,
  useTossAccounts,
  useTossExchangeRate,
  useTossHoldings,
  useTossPriceLimits,
  useTossPrices,
  useTossStockInfo,
  useTossStockWarnings,
} from "@/features/stock/model/useTossStocks";
import { BandTitle, DeltaText } from "@/features/stock/ui/phone/phone-parts";
import { isHardError } from "@/features/stock/lib/query-state";
import { BandFailure } from "@/shared/ui/groo/band-parts";
import { directionOf, directionOfPct } from "../../model/invest";
import {
  DailyBand,
  HeadBand,
  KvBand,
  NamuNotice,
  QuotesBand,
  TradeTail,
  WatchToggle,
  type KvLine,
} from "./detail-parts";

/**
 * 종목 상세 페이지 — 폰(I-13 18 ~ 21). 상단 바(← "종목 상세" + 관심 Toggle) 아래 띠:
 * ① 머리 · 차트 ② 내 보유(보유일 때만) ③ 호가 · 체결(토스) ④ 기본 정보 ⑤ 일별 시세(+ 토스는 끝에 매매).
 * 주소만으로 열린다 — 보유 종목인지는 같은 보유 질의에서 찾는다.
 */
export function StockDetailMobile({
  broker,
  symbol,
}: {
  broker: "TOSS" | "NAMU";
  symbol: string;
}) {
  const { t } = useTranslation("stocks");
  const master = useStockBySymbol(symbol).data ?? null;
  const toss = broker === "TOSS" ? <TossBody symbol={symbol} /> : null;
  const namu = broker === "NAMU" ? <NamuBody symbol={symbol} /> : null;
  return (
    <>
      <TopNavigation type="standard">
        <TopNavigationBackButton fallbackHref={brokerPath(broker)} />
        <TopNavigationTitle>{t("detail.sheetTitle")}</TopNavigationTitle>
        <TopNavigationActions>
          <WatchToggle symbol={symbol} marketCode={master?.marketCode} />
        </TopNavigationActions>
      </TopNavigation>
      <ScreenBands>
        {toss}
        {namu}
      </ScreenBands>
    </>
  );
}

const flush = (name: string, node: React.ReactNode) =>
  node ? (
    <div data-band="flush" data-section={name}>
      {node}
    </div>
  ) : null;

function TossBody({ symbol }: { symbol: string }) {
  const { t } = useTranslation("stocks");
  const mask = useMasked("stocks.detail");
  const master = useStockBySymbol(symbol).data ?? null;
  const infoQ = useTossStockInfo([symbol]);
  const info = infoQ.data?.[0];
  const pricesQ = useTossPrices([symbol]);
  // 미국 종목은 전일을 뉴욕 날짜로 가른다 — 시세 · 정보 · 마스터 어디서든 통화를 알면 쓴다(아래 currency 와 같은 근거)
  const knownCurrency =
    pricesQ.data?.[0]?.currency ?? info?.currency ?? master?.currency ?? null;
  const prevCloseQ = usePrevClose(
    symbol,
    knownCurrency === "USD" ? "America/New_York" : "Asia/Seoul",
  );
  const fxQ = useTossExchangeRate();
  const warningsQ = useTossStockWarnings(symbol);
  const accountsQ = useTossAccounts();
  const holdingsQ = useTossHoldings(accountsQ.data?.[0]?.accountSeq ?? null);
  const holding =
    holdingsQ.data?.items.find((h) => h.symbol === symbol) ?? null;
  const limitsQ = useTossPriceLimits(symbol);

  const name = master?.nameKr ?? info?.name ?? holding?.name ?? symbol;
  // 통화는 시세 응답의 것을 먼저 쓴다. 어디서도 모르면 빈 값 — 숫자만 보이고 KRW 로 추정하지 않는다(검수 M6)
  const currency = knownCurrency ?? holding?.currency ?? "";
  const isUs = currency === "USD";
  const isKr = currency === "KRW";
  const lastRaw = pricesQ.data?.[0]?.lastPrice;
  const last =
    lastRaw != null && Number.isFinite(Number.parseFloat(lastRaw))
      ? Number.parseFloat(lastRaw)
      : null;
  const fxRate = fxQ.data ? num(fxQ.data.rate) : null;
  const changePct = changePctOf(last, prevCloseQ.data);
  // 머리 증감의 금액 — 전일 종가를 못 받았으면 둘 다 없다(0.00% 를 지어내지 않는다)
  const changeAmount =
    last != null && prevCloseQ.data != null && prevCloseQ.data > 0
      ? last - prevCloseQ.data
      : null;
  const marketLabel = marketName(t, master?.marketCode ?? info?.market);
  const kind =
    info?.securityType === "ETF" || master?.securityType === "ETF"
      ? "ETF"
      : t(`securityType.${master?.securityType ?? "STOCK"}`, {
          defaultValue: t("info.stock"),
        });

  // 내 보유 — 한 줄에 하나(토스 아홉)
  const holdRows: KvLine[] = [];
  if (holding) {
    const ev = num(holding.marketValue.amount);
    const pnl = num(holding.profitLoss.amount);
    const pnlPct = num(holding.profitLoss.rate);
    const avg = num(holding.averagePurchasePrice);
    const day = num(holding.dailyProfitLoss.amount);
    const purchase = num(holding.marketValue.purchaseAmount);
    const fees = num(holding.cost.commission) + num(holding.cost.tax ?? "0");
    const cur = holding.currency.toUpperCase();
    const d = (n: number, text: string, strong = true) => (
      <DeltaText dir={directionOf(n)} text={mask(text)} strong={strong} />
    );
    holdRows.push(
      {
        key: "ev",
        name: t("holding.marketValue"),
        value: mask(fmtByCurrency(ev, cur)),
      },
      {
        key: "pnl",
        name: t("holding.profitLoss"),
        value: d(pnl, fmtByCurrency(Math.abs(pnl), cur)),
      },
      {
        key: "rate",
        name: t("holding.returnRate"),
        value: (
          <DeltaText
            strong
            dir={directionOfPct(pnlPct)}
            text={formatChangeRate(Math.abs(pnlPct), { sign: "none" })}
          />
        ),
      },
      {
        key: "qty",
        name: t("holding.quantity"),
        value: t("holding.sharesUnit", {
          count: num(holding.quantity).toLocaleString(),
        }),
      },
      {
        key: "avg",
        name: t("holding.avgPrice"),
        value: fmtByCurrency(avg, cur),
      },
      {
        key: "cost",
        name: t("holding.purchaseAmount"),
        value: mask(fmtByCurrency(purchase, cur)),
      },
      {
        key: "day",
        name: t("holding.dailyPnl"),
        value: d(day, fmtByCurrency(Math.abs(day), cur)),
      },
      {
        key: "fees",
        name: t("holding.feesTax"),
        value: fmtByCurrency(fees, cur),
      },
      {
        key: "sell",
        name: t("holding.sellable"),
        value: t("holding.sharesUnit", {
          count: num(holding.quantity).toLocaleString(),
        }),
      },
    );
  }

  // 기본 정보 — 상한가 · 하한가는 13b 가 "오늘 시세" 띠로 옮길 때까지 여기에 둔다
  const limits = limitsQ.data;
  const shares = num(info?.sharesOutstanding);
  const priceInKrw =
    last == null
      ? null
      : isUs
        ? fxRate == null
          ? null
          : last * fxRate
        : isKr
          ? last
          : null;
  const mcKRW = priceInKrw != null && shares > 0 ? priceInKrw * shares : null;
  const upper = limits?.upperLimitPrice ? num(limits.upperLimitPrice) : null;
  const lower = limits?.lowerLimitPrice ? num(limits.lowerLimitPrice) : null;
  const suspended = !!info?.koreanMarketDetail?.krxTradingSuspended;
  const infoRows: KvLine[] = [
    {
      key: "market",
      name: t("info.market"),
      value: info
        ? marketName(t, info.market)
        : isUs
          ? t("market.usShort")
          : t("market.krShort"),
    },
    {
      key: "type",
      name: t("info.securityType"),
      value: info?.securityType === "ETF" ? "ETF" : t("info.stock"),
    },
    { key: "cur", name: t("info.currency"), value: info?.currency ?? currency },
    ...(mcKRW != null
      ? [{ key: "cap", name: t("info.marketCap"), value: fmtCapKRW(mcKRW) }]
      : []),
    ...(isKr && upper != null
      ? [
          {
            key: "up",
            name: t("info.upperLimit"),
            value: money(upper),
            tone: "critical" as const,
          },
        ]
      : []),
    ...(isKr && lower != null
      ? [
          {
            key: "low",
            name: t("info.lowerLimit"),
            value: money(lower),
            tone: "informative" as const,
          },
        ]
      : []),
    ...(info?.listDate
      ? [
          {
            key: "list",
            name: t("info.listDate"),
            value: formatDateLong(info.listDate),
          },
        ]
      : []),
    ...(shares > 0
      ? [
          {
            key: "shares",
            name: t("info.sharesOutstanding"),
            value: fmtShares(shares),
          },
        ]
      : []),
    // 거래상태는 국내 종목의 정보(koreanMarketDetail)가 있을 때만 — 모르는 값을 "정상" 으로 말하지 않는다(미국 · 빈 응답은 줄 없음, 검수 M5)
    ...(info?.koreanMarketDetail
      ? [
          {
            key: "status",
            name: t("info.tradingStatus"),
            value: suspended ? t("info.suspended") : t("info.normal"),
            tone: suspended ? ("critical" as const) : ("positive" as const),
          },
        ]
      : []),
  ];

  return (
    <>
      <div>
        <HeadBand
          name={name}
          detail={`${symbol} · ${marketLabel} · ${kind}`}
          priceText={last != null ? fmtByCurrency(last, currency) : "—"}
          pct={changePct}
          changeAmount={changeAmount}
          currency={currency}
          approx={
            isUs && last != null && fxRate != null
              ? `≈ ${won(Math.round(last * fxRate))}`
              : undefined
          }
          unavailable={
            last == null && !pricesQ.isLoading && !isHardError(pricesQ)
              ? t("detail.priceUnavailable")
              : undefined
          }
          failed={isHardError(pricesQ)}
          onRetry={() => void pricesQ.refetch()}
          loading={pricesQ.isLoading}
          warnings={(warningsQ.data ?? []).map((w) =>
            t(`warning.${w.warningType}`, { defaultValue: w.warningType }),
          )}
          symbol={symbol}
          isUs={isUs}
        />
      </div>
      {holding &&
        flush(
          "holding",
          <KvBand
            id="stock-holding"
            title={t("holding.title")}
            rows={holdRows}
          />,
        )}
      {flush(
        "quotes",
        <QuotesBand
          symbol={symbol}
          currency={currency}
          lastPrice={last}
          changePct={changePct}
        />,
      )}
      {flush(
        "info",
        // 정보 조회가 실패했는데 "정상" 으로 그리면 거래정지 종목이 멀쩡해 보인다 — 실패 한 벌(검수 H2)
        isHardError(infoQ) ? (
          <section aria-labelledby="stock-info">
            <BandTitle id="stock-info">{t("info.title")}</BandTitle>
            <div className="pb-x6 pt-x3">
              <BandFailure
                band
                title={t("info.failTitle")}
                onRetry={() => void infoQ.refetch()}
              />
            </div>
          </section>
        ) : (
          <KvBand
            id="stock-info"
            title={t("info.title")}
            rows={infoRows}
            loading={infoQ.isLoading}
          />
        ),
      )}
      {flush(
        "daily",
        <DailyBand
          symbol={symbol}
          currency={currency}
          tail={<TradeTail isUs={isUs} />}
        />,
      )}
    </>
  );
}

function NamuBody({ symbol }: { symbol: string }) {
  const { t } = useTranslation("stocks");
  const mask = useMasked("stocks.detail");
  const master = useStockBySymbol(symbol).data ?? null;
  const krwQ = useNamuHoldings("KRW");
  const usdQ = useNamuHoldings("USD");
  const fxQ = useSecuritiesExchangeRate();
  const view = mergeNamuHoldings(krwQ.data, usdQ.data, fxQ.data?.rate ?? null);
  const holding = view.rows.find((r) => r.symbol === symbol) ?? null;
  const name = master?.nameKr ?? holding?.name ?? symbol;
  const currency: string = holding
    ? holding.currency
    : (master?.currency ?? "KRW");
  const isUs = currency === "USD";
  const quoteQ = useSecuritiesPrices(
    holding == null ? [symbol] : [],
    WATCH_POLL_MS,
  );
  const quote = quoteQ.data?.[0];
  const last = holding ? num(holding.currentPrice) : (quote?.price ?? null);
  const prevClose = holding ? null : (quote?.previousClose ?? null);
  const changeAmount =
    prevClose != null && prevClose > 0 && last != null
      ? last - prevClose
      : null;
  const changePct =
    prevClose != null && prevClose > 0 && last != null
      ? ((last - prevClose) / prevClose) * 100
      : null;

  const holdRows: KvLine[] = [];
  if (holding) {
    const ev = num(holding.evalAmount);
    const pnl = num(holding.profitLoss);
    const cost = ev - pnl;
    const pct = cost > 0 ? (pnl / cost) * 100 : 0;
    holdRows.push(
      {
        key: "ev",
        name: t("holding.marketValue"),
        value: mask(fmtByCurrency(ev, currency)),
      },
      {
        key: "pnl",
        name: t("holding.profitLoss"),
        value: (
          <DeltaText
            strong
            dir={directionOf(pnl)}
            text={mask(fmtByCurrency(Math.abs(pnl), currency))}
          />
        ),
      },
      {
        key: "qty",
        name: t("holding.quantity"),
        value: t("holding.sharesUnit", {
          count: num(holding.quantity).toLocaleString(),
        }),
      },
      {
        key: "rate",
        name: t("holding.returnRate"),
        value: (
          <DeltaText
            strong
            dir={directionOfPct(pct)}
            text={formatChangeRate(Math.abs(pct), { sign: "none" })}
          />
        ),
      },
      {
        key: "avg",
        name: t("holding.avgPrice"),
        value: fmtByCurrency(num(holding.avgPrice), currency),
      },
      {
        key: "cost",
        name: t("holding.purchaseAmount"),
        value: mask(fmtByCurrency(cost, currency)),
      },
    );
  }
  const infoRows: KvLine[] = [
    {
      key: "market",
      name: t("info.market"),
      value: master
        ? marketName(t, master.marketCode)
        : isUs
          ? t("market.usShort")
          : t("market.krShort"),
    },
    { key: "cur", name: t("info.currency"), value: currency },
    {
      key: "type",
      name: t("info.securityType"),
      value: master?.securityType === "ETF" ? "ETF" : t("info.stock"),
    },
  ];
  return (
    <>
      <div>
        <HeadBand
          name={name}
          detail={
            master ? `${symbol} · ${marketName(t, master.marketCode)}` : symbol
          }
          priceText={
            last != null && last > 0 ? fmtByCurrency(last, currency) : "—"
          }
          pct={changePct}
          changeAmount={changeAmount}
          currency={currency}
          unavailable={
            (last == null || last === 0) && !quoteQ.isLoading
              ? t("namu.priceEmpty")
              : undefined
          }
          loading={krwQ.isLoading && usdQ.isLoading}
          symbol={symbol}
          isUs={isUs}
        />
      </div>
      {holding &&
        flush(
          "holding",
          <KvBand
            id="stock-holding"
            title={t("holding.title")}
            rows={holdRows}
          />,
        )}
      {flush(
        "info",
        <KvBand id="stock-info" title={t("info.title")} rows={infoRows} />,
      )}
      {flush(
        "daily",
        <DailyBand symbol={symbol} currency={currency} tail={<NamuNotice />} />,
      )}
    </>
  );
}
