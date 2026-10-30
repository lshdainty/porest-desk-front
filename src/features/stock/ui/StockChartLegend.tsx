/**
 * 캔들 차트 위 범례 — 크로스헤어(또는 마지막 봉)의 O H L C 와 거래량.
 *
 * 글은 R10 범례(t3 · 400 · fg-neutral-subtle, 숫자 고정폭)다. 오름 · 내림 색은 캔들과 같은 방향 색이다
 * (오름 fg-critical · 내림 fg-informative — 국내 관례, DESIGN 증감). 차트 그림 위 자기 줄이다(겹치지 않는다 — 폰 · 글자 200% 에서 눈금 · 캔들과
 * 겹치던 것을 줄로 뺐다). 줄바꿈은 허용하고 여백은 눈금(spacing-x1 · x1_5)으로만 둔다(I-05 30). 증권 화면(stock-chart-card)과 앱 임베드가 함께 쓴다.
 */
export interface StockChartLegendValue {
  o: number;
  h: number;
  l: number;
  c: number;
  vol: number;
  up: boolean;
}

export function StockChartLegend({
  legend,
  isUs,
}: {
  legend: StockChartLegendValue;
  isUs: boolean;
}) {
  const fmtPrice = (v: number) =>
    isUs ? `$${v.toFixed(2)}` : Math.round(v).toLocaleString("ko-KR");
  const fmtVol = (v: number) =>
    v >= 1_000_000
      ? `${(v / 1_000_000).toFixed(1)}M`
      : v >= 1_000
        ? `${(v / 1_000).toFixed(0)}K`
        : `${Math.round(v)}`;

  return (
    <div
      data-slot="chart-legend"
      className="shrink-0 flex flex-wrap gap-x-x2 px-x1_5 py-x1 text-t3 font-normal text-fg-neutral-subtle tabular-nums"
    >
      <span
        data-slot="chart-legend-ohlc"
        data-direction={legend.up ? "up" : "down"}
        className={legend.up ? "text-fg-critical" : "text-fg-informative"}
      >
        O {fmtPrice(legend.o)} H {fmtPrice(legend.h)} L {fmtPrice(legend.l)} C{" "}
        {fmtPrice(legend.c)}
      </span>
      <span data-slot="chart-legend-vol" className="text-fg-neutral-subtle">
        VOL {fmtVol(legend.vol)}
      </span>
    </div>
  );
}
