import { describe, expect, it } from "vitest";
import { dayKeyOf, monthWeeks, pickWeek } from "./month-weeks";

describe("month-weeks — 실제 달력과 스켈레톤이 같이 쓰는 주 계산", () => {
  it("일요일 시작 7칸 주로 나누고 달 밖은 null 이다", () => {
    const w = monthWeeks("2026-09");
    expect(w.every((r) => r.length === 7)).toBe(true);
    expect(w[0]!.map((c) => c?.d ?? null)).toEqual([null, null, 1, 2, 3, 4, 5]);
    const lastWeek = w[w.length - 1]!;
    expect(lastWeek[lastWeek.length - 1]).toBeNull();
    expect(w.flat().filter(Boolean)).toHaveLength(30);
  });

  it("고른 날 → 오늘 → 첫 주 순으로 접힌 주를 고른다", () => {
    const w = monthWeeks("2026-10");
    expect(pickWeek(w, "2026-10-28", "2026-10-15")).toBe(4);
    expect(pickWeek(w, null, "2026-10-15")).toBe(2);
    expect(pickWeek(w, null, "2026-09-15")).toBe(0);
  });

  it("dayKeyOf 는 기기 시계의 YYYY-MM-DD", () => {
    expect(dayKeyOf(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});
