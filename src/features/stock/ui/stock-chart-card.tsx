/**
 * 종목 캔들 차트 카드 — 차트 + 기간 세그먼트.
 *
 * **캔들은 증권사 하나만 연결돼 있으면 된다.** 예전엔 백엔드 캔들 경로가
 * `/api/v1/toss/candles` 하나뿐이라 토스 키가 없으면 `SECURITIES_CREDENTIAL_REQUIRED` 가
 * 났고, 그래서 여기 분기도 "토스가 연결됐나" 였다. 지금은
 * `/api/v1/securities/candles`(`SecuritiesApiController#getCandles`)가 사용자가 고른 소스로
 * 대신 조회하고, 그 소스가 캔들을 못 주면 연결된 다른 증권사로 넘어간다.
 *
 * 그래서 조건이 **"캔들을 줄 수 있는 증권사가 연결돼 있나"** 가 됐다. 서버가 알아서 고르므로
 * 화면이 증권사 이름을 알 필요는 없고, 하나라도 연결됐는지만 보면 된다.
 *
 * 못 그릴 때 빈 캔버스를 남기면 사용자는 로딩이 끝나기를 기다린다 — 이유를 적어 준다.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LineChart } from "lucide-react";
import { Card } from "@/shared/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { LightweightStockChart } from "./LightweightStockChart";
import {
  RANGES,
  RANGE_LABEL_KEY,
  useCandleAvailability,
  type Range,
} from "../model/chart-range";

export function StockChartCard({
  symbol,
  isUs,
  mobile,
}: {
  symbol: string;
  isUs: boolean;
  mobile: boolean;
}) {
  const { t } = useTranslation("stocks");
  const [range, setRange] = useState<Range>("1D");
  const availability = useCandleAvailability();
  const height = mobile ? 168 : 200;

  return (
    <Card style={{ padding: mobile ? "14px 14px 14px" : "16px 18px 16px" }}>
      <div style={{ height }}>
        {availability === "yes" ? (
          <LightweightStockChart
            symbol={symbol}
            isUs={isUs}
            range={range}
            height={height}
          />
        ) : availability === "unknown" ? null : (
          <div
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              textAlign: "center",
              color: "var(--fg-tertiary)",
            }}
          >
            <LineChart size={28} />
            <div style={{ fontSize: "var(--text-body-sm)", lineHeight: 1.5 }}>
              {t("chart.brokerRequired")}
            </div>
          </div>
        )}
      </div>
      {availability !== "no" && (
        <div style={{ marginTop: 8 }}>
          <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
            <TabsList variant="pill" size="sm" style={{ width: "100%" }}>
              {RANGES.map((r) => (
                <TabsTrigger
                  key={r}
                  variant="pill"
                  value={r}
                  style={{ flex: 1 }}
                >
                  {t(RANGE_LABEL_KEY[r])}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}
    </Card>
  );
}
