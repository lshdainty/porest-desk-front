import { describe, expect, it } from "vitest";
import type { CollectionEntry } from "@/features/constellation";
import { newestKeyOf } from "./collection";
import { REPORT_MAX_WEEKS_BACK, addDays, mondayOf } from "./week";

describe("관측 리포트 주(I-11 16 · Q3-B)", () => {
  it("월요일 기준 주 — 2026-10-22(목)의 월요일은 10-19", () => {
    expect(mondayOf("2026-10-22")).toBe("2026-10-19");
    expect(mondayOf("2026-10-25")).toBe("2026-10-19");
    expect(mondayOf("2026-10-19")).toBe("2026-10-19");
  });
  it("지난주까지만 거슬러 간다(서버 기본 14일)", () => {
    expect(REPORT_MAX_WEEKS_BACK).toBe(1);
    expect(addDays(mondayOf("2026-10-22"), -7)).toBe("2026-10-12");
  });
});

const entry = (key: string, count: number, last: string | null) =>
  ({
    constellation: { constellationKey: key },
    collectCount: count,
    lastCollectedDate: last,
  }) as CollectionEntry;

describe("도감 NEW 기준(I-11 11)", () => {
  it("횟수와 무관하게 마지막으로 모은 하나", () => {
    expect(
      newestKeyOf([
        entry("a", 1, "2026-10-01"),
        entry("b", 128, "2026-10-21"),
        entry("c", 0, null),
      ]),
    ).toBe("b");
  });
  it("모은 것이 없으면 없다", () => {
    expect(newestKeyOf([entry("a", 0, null)])).toBeNull();
  });
});
