import { useTranslation } from "react-i18next";
import { money } from "@/shared/lib/groo/format";
import { Card } from "@/shared/ui/card";
import { fmtCapKRW, fmtShares, num } from "@/features/stock/lib/format";
import type { TossStockInfo } from "@/features/stock/api/stockApi";
import { useTossPriceLimits } from "@/features/stock/model/useTossStocks";

// ---- 종목 기본정보 (토스 stocks + price-limits) ----------------------------

export function StockInfoCard({
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
