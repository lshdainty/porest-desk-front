// 달력에서 고른 기간 → 보기(월 · 분기 · 년 · 직접) — 옛 시트의 월 · 분기 · 년 탭이 하던 일
import { describe, expect, it } from "vitest";
import { monthRangeOf, rangeSegModeOf, type RangeState } from "./stats-range";

const D = (y: number, m: number, d: number) => new Date(y, m - 1, d);
const oct: RangeState = monthRangeOf(D(2026, 10, 29));

describe("rangeSegModeOf", () => {
  it("지금 기간 그대로면 보기를 지킨다", () => {
    expect(rangeSegModeOf(oct.from, oct.to, oct)).toBe("m");
    const custom: RangeState = { ...oct, segMode: "custom" };
    expect(rangeSegModeOf(oct.from, oct.to, custom)).toBe("custom");
  });
  it("한 달 · 한 분기 · 한 해를 정확히 채우면 그 보기", () => {
    expect(rangeSegModeOf(D(2026, 9, 1), D(2026, 9, 30), oct)).toBe("m");
    expect(rangeSegModeOf(D(2026, 2, 1), D(2026, 2, 28), oct)).toBe("m");
    expect(rangeSegModeOf(D(2026, 7, 1), D(2026, 9, 30), oct)).toBe("q");
    expect(rangeSegModeOf(D(2026, 1, 1), D(2026, 12, 31), oct)).toBe("y");
  });
  it("그 밖은 직접", () => {
    expect(rangeSegModeOf(D(2026, 7, 1), D(2026, 10, 31), oct)).toBe("custom");
    expect(rangeSegModeOf(D(2026, 10, 1), D(2026, 10, 30), oct)).toBe("custom");
    expect(rangeSegModeOf(D(2026, 10, 12), D(2026, 10, 12), oct)).toBe(
      "custom",
    );
  });
});
