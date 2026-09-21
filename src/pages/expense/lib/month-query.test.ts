import { describe, expect, it } from "vitest";
import { monthFromQuery } from "./month-query";

// 가계부 주소의 `?month=` — 못 읽으면 이번 달이다(QA 24차 9: "NaN년 NaN월").
describe("주소의 달", () => {
  const now = new Date(2026, 8, 21); // 2026-09-21

  it("yyyy-MM 이면 그대로 쓴다", () => {
    expect(monthFromQuery("2026-08", now)).toBe("2026-08");
  });

  it("없으면 이번 달이다", () => {
    expect(monthFromQuery(null, now)).toBe("2026-09");
    expect(monthFromQuery("", now)).toBe("2026-09");
  });

  it("못 읽는 값이면 이번 달이다 — NaN 달을 만들지 않는다", () => {
    for (const raw of [
      "8",
      "2026-8",
      "2026-13",
      "2026-00",
      "abcd-ef",
      "2026-08-01",
    ]) {
      expect(monthFromQuery(raw, now), raw).toBe("2026-09");
    }
  });
});
