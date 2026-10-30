import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";
import { MaskAmount } from "@/shared/lib/groo/hide-amounts";
import { formatChangeRate } from "@/shared/lib/groo/format";
import { Card } from "@/shared/ui/card";
import { fmtByCurrency, num, trendColor } from "@/features/stock/lib/format";
import { type MergedHolding } from "@/features/stock/lib/holdings";
import {
  useSecuritiesPrices,
  WATCH_POLL_MS,
} from "@/features/stock/model/useSecuritiesPrices";
import { useStockBySymbol } from "@/features/stock/model/useStockMaster";
import { PctBadge, WatchStar } from "@/features/stock/ui/stock-row";
import { StockChartCard } from "@/features/stock/ui/stock-chart-card";
import { DailyQuoteTable } from "@/features/stock/ui/daily-quote-table";

// ---- 종목 상세 ------------------------------------------------------------

/**
 * 상세 본문 — 헤더 · 현재가 · 차트 · 일별 시세 · 내 보유.
 *
 * 토스 상세와 달리 호가·체결이 없다. 나무 API 에 없어서다 — 빈 카드를 자리만 채워 두면
 * 사용자는 로딩이 안 끝난 걸로 읽는다. 대신 **사이드 열에 내 보유를 올려** 열을 채운다.
 *
 * 일별 시세는 **일봉에서 파생**하고 캔들은 이미 증권사 무관 경로라 나무에서도 나온다.
 */
export function NamuStockDetail({
  symbol,
  holding,
  watched,
  onToggleWatch,
  mobile,
}: {
  symbol: string;
  holding: MergedHolding | null;
  watched: boolean;
  onToggleWatch: (marketCode?: string) => void;
  mobile: boolean;
}) {
  const { t } = useTranslation("stocks");
  const masterQ = useStockBySymbol(symbol);
  const master = masterQ.data ?? null;
  const name = master?.nameKr ?? holding?.name ?? symbol;
  // 보유 종목이면 행이 자기 통화를 안다. 아니면 마스터가 안다.
  const currency: string = holding
    ? holding.currency
    : (master?.currency ?? "KRW");
  const isUs = currency === "USD";

  // 현재가 — 보유 종목이면 잔고 응답에 이미 있다(추가 호출 없음).
  // 관심 종목만 서버 대리 조회로 1콜. 나무는 다건 API 가 없어 여기서 아끼는 게 그대로 유량이다.
  const needsQuote = holding == null;
  const quoteQ = useSecuritiesPrices(needsQuote ? [symbol] : [], WATCH_POLL_MS);
  const quote = quoteQ.data?.[0];
  const last = holding ? num(holding.currentPrice) : (quote?.price ?? null);
  const prevClose = holding ? null : (quote?.previousClose ?? null);
  const changePct =
    prevClose != null && prevClose > 0 && last != null
      ? ((last - prevClose) / prevClose) * 100
      : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 헤더: 종목명 · 현재가 · 관심 토글 — 한 줄로 압축 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
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
            <span>{symbol}</span>
            {master && <span>·</span>}
            {master && (
              <span>
                {t(`market.${master.marketCode}`, {
                  defaultValue: master.marketCode,
                })}
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            className="num"
            style={{
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "var(--fg-primary)",
            }}
          >
            {last != null && last > 0 ? fmtByCurrency(last, currency) : "—"}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              justifyContent: "flex-end",
              marginTop: 2,
            }}
          >
            {changePct != null && <PctBadge pct={changePct} size={13} />}
            {(last == null || last === 0) && !quoteQ.isLoading && (
              <span
                style={{
                  fontSize: "var(--text-caption)",
                  color: "var(--fg-tertiary)",
                }}
              >
                {t("namu.priceEmpty")}
              </span>
            )}
          </div>
        </div>
        <WatchStar
          watched={watched}
          onToggle={() => onToggleWatch(master?.marketCode)}
        />
      </div>

      {/* 본문 2열 — 나무는 호가/체결이 없어 사이드에 '내 보유' 가 선다. */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: mobile ? "1fr" : "minmax(0, 1fr) 296px",
          gap: 14,
          alignItems: "start",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            minWidth: 0,
          }}
        >
          {/* 차트 — 캔들은 증권사 무관 경로다. 카드가 알아서 가른다. */}
          <StockChartCard symbol={symbol} isUs={isUs} mobile={mobile} />
          <DailyQuoteTable symbol={symbol} currency={currency} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {holding && <NamuHoldingCard holding={holding} currency={currency} />}
          <NamuInfoCard master={master} currency={currency} />
          {/* 조회 범위 안내 — 나무가 아직 안 주는 것을 밝힌다. */}
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
            <Info
              size={14}
              color="var(--fg-tertiary)"
              style={{ flexShrink: 0 }}
            />
            <span
              style={{
                fontSize: "var(--text-badge)",
                color: "var(--fg-secondary)",
                lineHeight: 1.45,
              }}
            >
              {t("namu.scopeNotice")}
            </span>
          </div>
        </div>
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

/** 종목 정보 — 나무는 마스터가 아는 것까지다(시총·상장주식수·상하한가는 안 준다). */
function NamuInfoCard({
  master,
  currency,
}: {
  master: ReturnType<typeof useStockBySymbol>["data"] | null;
  currency: string;
}) {
  const { t } = useTranslation("stocks");
  const rows: Array<[string, string]> = [
    [
      t("info.market"),
      master
        ? t(`market.${master.marketCode}`, { defaultValue: master.marketCode })
        : currency === "USD"
          ? t("market.usShort")
          : t("market.krShort"),
    ],
    [t("info.currency"), currency],
    [
      t("info.securityType"),
      master?.securityType === "ETF" ? "ETF" : t("info.stock"),
    ],
  ];
  return (
    <Card style={{ padding: 16 }}>
      <div
        style={{
          fontSize: 12.5,
          fontWeight: 700,
          color: "var(--fg-secondary)",
          marginBottom: 10,
        }}
      >
        {t("info.title")}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {rows.map(([k, v], i) => (
          <div
            key={k}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "9px 0",
              borderTop: i === 0 ? 0 : "1px solid var(--border-subtle)",
            }}
          >
            <span style={{ fontSize: 12.5, color: "var(--fg-tertiary)" }}>
              {k}
            </span>
            <span
              className="num"
              style={{
                fontSize: "var(--text-label-sm)",
                fontWeight: 600,
                color: "var(--fg-primary)",
              }}
            >
              {v}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/** 내 보유 — 잔고 응답이 주는 값만 쓴다(수수료·세금·매도가능수량은 나무가 안 준다). */
function NamuHoldingCard({
  holding,
  currency,
}: {
  holding: MergedHolding;
  currency: string;
}) {
  const { t } = useTranslation("stocks");
  const ev = num(holding.evalAmount);
  const pnl = num(holding.profitLoss);
  const qty = num(holding.quantity);
  const avg = num(holding.avgPrice);
  const cost = ev - pnl;
  const pct = cost > 0 ? (pnl / cost) * 100 : 0;
  const rows: Array<[string, React.ReactNode, string]> = [
    [
      t("holding.marketValue"),
      <MaskAmount card="stocks.detail" key="ev">
        {fmtByCurrency(ev, currency)}
      </MaskAmount>,
      "var(--fg-primary)",
    ],
    [
      t("holding.profitLoss"),
      <MaskAmount
        card="stocks.detail"
        key="pnl"
      >{`${pnl >= 0 ? "+" : "−"}${fmtByCurrency(Math.abs(pnl), currency)}`}</MaskAmount>,
      trendColor(pnl),
    ],
    [
      t("holding.quantity"),
      t("holding.sharesUnit", { count: qty }),
      "var(--fg-primary)",
    ],
    [
      t("holding.returnRate"),
      `${formatChangeRate(pct, { sign: "always" })}`,
      trendColor(pnl),
    ],
    [
      t("holding.avgPrice"),
      fmtByCurrency(avg, currency),
      "var(--fg-secondary)",
    ],
    [
      t("holding.purchaseAmount"),
      <MaskAmount card="stocks.detail" key="cost">
        {fmtByCurrency(cost, currency)}
      </MaskAmount>,
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
}
