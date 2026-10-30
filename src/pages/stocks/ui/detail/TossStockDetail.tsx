import { AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { formatChangeRate, money } from "@/shared/lib/groo/format";
import { MaskAmount } from "@/shared/lib/groo/hide-amounts";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { fmtByCurrency, num, trendColor } from "@/features/stock/lib/format";
import { PctBadge, WatchStar } from "@/features/stock/ui/stock-row";
import { StockChartCard } from "@/features/stock/ui/stock-chart-card";
import { DailyQuoteTable } from "@/features/stock/ui/daily-quote-table";
import type { TossHoldingsItem } from "@/features/stock/api/stockApi";
import {
  changePctOf,
  usePrevClose,
  useTossExchangeRate,
  useTossPrices,
  useTossStockInfo,
  useTossStockWarnings,
} from "@/features/stock/model/useTossStocks";
import { useStockBySymbol } from "@/features/stock/model/useStockMaster";
import { QuotesCard } from "./TossQuotes";
import { StockInfoCard } from "./TossStockInfo";

// ---- 종목 상세 본문 ------------------------------------------------------

export function StockDetailBody({
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
                background: "var(--color-bg-warning-weak)",
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
              `${formatChangeRate(pnlPct, { sign: "always" })}`,
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
