/**
 * 일별 시세 표 — **증권사와 무관하다.**
 *
 * 토스 화면 안에 있던 것을 그대로 끌어냈다(마크업·스타일 무변경). 표가 쓰는 건 토스 전용
 * API 가 아니라 **일봉**이고, 캔들은 #305 에서 이미 증권사 무관 경로
 * (`/v1/securities/candles`)로 옮겼다 — 서버가 사용자의 기본 소스로 조회하고 그 소스가
 * 캔들을 못 주면 연결된 다른 증권사로 넘어간다. 그래서 **나무에서도 같은 표가 나온다**.
 *
 * 추가 호출이 없다시피 한 이유 — 상세 화면의 차트가 이미 같은 심볼의 일봉을 받는다.
 * 같은 쿼리키를 공유하므로 react-query 캐시가 겹친다.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/ui/card";
import { Skeleton as SkeletonBase } from "@/shared/ui/skeleton";
import { securitiesApi } from "../api/securitiesApi";
import { fmtByCurrency, trendColor } from "../lib/format";
import { PanelEmpty } from "./stock-row";

/**
 * 일별 표가 쓰는 일봉. 하루에 한 번 바뀌는 값이라 길게 캐시한다.
 *
 * 252봉(≈1년)을 받아 최근 9봉만 쓰는 이유 — 차트의 1년 탭과 **같은 요청**이라 캐시가
 * 겹친다. 표만을 위해 더 짧게 부르면 요청이 하나 더 는다.
 */
function useDailyCandles(symbol: string | null) {
  return useQuery({
    queryKey: ["securities", "candles", symbol, "1d", 252],
    queryFn: () => securitiesApi.getCandles(symbol!, "1d", { count: 252 }),
    enabled: !!symbol,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60_000,
  });
}

export function DailyQuoteTable({
  symbol,
  currency,
}: {
  symbol: string;
  currency: string;
}) {
  const { t } = useTranslation("stocks");
  const q = useDailyCandles(symbol);
  const fmt = (v: number) => fmtByCurrency(v, currency);
  const rows = useMemo(() => {
    const asc = [...(q.data?.candles ?? [])].sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp),
    );
    const recent = asc.slice(-9);
    const out: { date: string; close: number; chg: number; vol: number }[] = [];
    for (let i = recent.length - 1; i >= 1; i--) {
      const c = recent[i]!;
      const prev = Number.parseFloat(recent[i - 1]!.closePrice);
      const close = Number.parseFloat(c.closePrice);
      const chg = prev > 0 ? ((close - prev) / prev) * 100 : 0;
      out.push({
        date: c.timestamp.slice(5, 10).replace("-", "."),
        close,
        chg,
        vol: Math.round(Number.parseFloat(c.volume)),
      });
    }
    return out.slice(0, 8);
  }, [q.data]);

  // 로딩 스켈레톤과 실렌더가 반드시 같은 컬럼비로 서야 해서 그리드 정의를 한 곳에 둔다
  const gridCols =
    "minmax(0,1fr) minmax(0,1.2fr) minmax(0,1fr) minmax(0,1.3fr)";
  // 스켈레톤 행 셀 — 실렌더 데이터 셀 정합.
  // 높이를 명시하는 이유: 실렌더 행 높이는 텍스트 라인박스(12.5 x line-height 1.5 = 18.75)가
  // 정하는데, 스켈레톤은 바 두께(14)가 정해 행마다 4.75px 씩 짧아진다. 8행이면 38px 이 밀린다.
  // border-box 라 16(padding) + 1(border) 을 뺀 18.75 가 콘텐츠 높이로 남는다.
  const skelCell = {
    padding: "8px 0",
    borderTop: "1px solid var(--border-subtle)",
    height: 35.75,
    display: "flex",
    alignItems: "center",
  } as const;

  const headCell = (h: string, align: "left" | "right") => (
    <div
      key={h}
      style={{
        fontSize: "var(--text-badge)",
        color: "var(--fg-tertiary)",
        fontWeight: 600,
        padding: "0 0 8px",
        textAlign: align,
        whiteSpace: "nowrap",
      }}
    >
      {h}
    </div>
  );
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
        {t("daily.title")}
      </div>
      {q.isLoading ? (
        // 헤더 4셀은 정적 틀이라 로딩에도 실제로 렌더하고, 서버 데이터가 들어갈 행만 스켈레톤.
        // 행 8개는 실렌더 최대치(rows = 최근 9캔들 → out.slice(0, 8))와 동일.
        // 문구 로딩을 걷어낸 대신 aria 로 스크린리더 안내를 남긴다.
        <div
          style={{ display: "grid", gridTemplateColumns: gridCols }}
          aria-busy
          aria-label={t("daily.loading")}
        >
          {headCell(t("daily.date"), "left")}
          {headCell(t("daily.close"), "right")}
          {headCell(t("daily.changeRate"), "right")}
          {headCell(t("daily.volume"), "right")}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ display: "contents" }}>
              {/* 1~3열은 fontSize 12.5(h-3.5), 4열 거래량만 --text-badge(h-3) — 실렌더 셀 타이포 대응 */}
              <div style={skelCell}>
                <SkeletonBase className="h-3.5 w-10" />
              </div>
              <div style={skelCell}>
                <SkeletonBase className="h-3.5 w-14 ml-auto" />
              </div>
              <div style={skelCell}>
                <SkeletonBase className="h-3.5 w-12 ml-auto" />
              </div>
              <div style={skelCell}>
                <SkeletonBase className="h-3 w-16 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <PanelEmpty msg={t("daily.empty")} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: gridCols }}>
          {headCell(t("daily.date"), "left")}
          {headCell(t("daily.close"), "right")}
          {headCell(t("daily.changeRate"), "right")}
          {headCell(t("daily.volume"), "right")}
          {rows.map((r) => (
            <div key={r.date} style={{ display: "contents" }}>
              <div
                className="num"
                style={{
                  fontSize: 12.5,
                  color: "var(--fg-secondary)",
                  padding: "8px 0",
                  borderTop: "1px solid var(--border-subtle)",
                  whiteSpace: "nowrap",
                }}
              >
                {r.date}
              </div>
              <div
                className="num"
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "var(--fg-primary)",
                  padding: "8px 0",
                  borderTop: "1px solid var(--border-subtle)",
                  textAlign: "right",
                  whiteSpace: "nowrap",
                }}
              >
                {fmt(r.close)}
              </div>
              <div
                className="num"
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: trendColor(r.chg),
                  padding: "8px 0",
                  borderTop: "1px solid var(--border-subtle)",
                  textAlign: "right",
                  whiteSpace: "nowrap",
                }}
              >
                {r.chg >= 0 ? "+" : ""}
                {r.chg.toFixed(2)}%
              </div>
              <div
                className="num"
                style={{
                  fontSize: "var(--text-badge)",
                  color: "var(--fg-tertiary)",
                  padding: "8px 0",
                  borderTop: "1px solid var(--border-subtle)",
                  textAlign: "right",
                  whiteSpace: "nowrap",
                }}
              >
                {r.vol.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
