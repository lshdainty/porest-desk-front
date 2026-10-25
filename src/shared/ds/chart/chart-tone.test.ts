// 지표 타일 점 · 바탕이 같은 색의 옅은 단계("blue-weak")를 받는다 — 강조하지 않는 비교 계열(지난 기간, I-08 37)
import { describe, expect, it } from "vitest";
import { CHART_ORDER, chartVar } from "./chart-variants";
import { DOT_BG, SUBTLE_BG } from "./chart-variants";

describe("차트 색 단계 weak", () => {
  it("열 색 모두 weak 점 클래스 · 같은 색 옅은 바탕 · 변수 이름이 있다", () => {
    for (const c of [...CHART_ORDER, "gray" as const]) {
      expect(DOT_BG[`${c}-weak`]).toBe(`bg-chart-${c}-weak`);
      expect(SUBTLE_BG[`${c}-weak`]).toBe(`bg-chart-${c}-subtle`);
      expect(chartVar(`${c}-weak`)).toBe(`var(--color-chart-${c}-weak)`);
    }
  });
});
