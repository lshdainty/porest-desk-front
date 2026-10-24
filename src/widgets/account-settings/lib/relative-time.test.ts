// 기기 "마지막 사용" 글 = DESIGN.md 지난 시간 규칙(I-12 27) — 고정한 오늘로 센다.
import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/i18n/config", () => ({ i18n: { language: "ko" } }));
const { relativeTime } = await import("./relative-time");

const KEYS: Record<string, string> = {
  justNow: "방금 전",
  yesterday: "어제",
};
const t = (k: string, o?: { count: number }) =>
  k === "minutesAgo"
    ? `${o!.count}분 전`
    : k === "hoursAgo"
      ? `${o!.count}시간 전`
      : k === "daysAgo"
        ? `${o!.count}일 전`
        : (KEYS[k] ?? k);

// 고정한 오늘 2026-10-23 12:00 UTC
const NOW = Date.UTC(2026, 9, 23, 12, 0, 0);
const ago = (ms: number) => new Date(NOW - ms).toISOString().slice(0, 19);

describe("relativeTime", () => {
  it("30초 · 3시간 · 어제 · 3일", () => {
    expect(relativeTime(t, ago(30_000), NOW)).toBe("방금 전");
    expect(relativeTime(t, ago(3 * 3600_000), NOW)).toBe("3시간 전");
    expect(relativeTime(t, ago(30 * 3600_000), NOW)).toBe("어제");
    expect(relativeTime(t, ago(3 * 86400_000), NOW)).toBe("3일 전");
  });
  it("10일 = 올해 날짜(연도 없음), 400일 = 연도 붙임", () => {
    expect(relativeTime(t, ago(10 * 86400_000), NOW)).toBe("10월 13일");
    expect(relativeTime(t, ago(400 * 86400_000), NOW)).toBe("2025년 9월 18일");
  });
  it("시각이 없으면 null", () => {
    expect(relativeTime(t, null, NOW)).toBeNull();
  });
});
