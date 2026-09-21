import { describe, expect, it } from "vitest";
import { isRefundableDate } from "./refund-window";

// 환불일은 거래일부터 오늘까지다(D16) — 거래일이 오늘보다 뒤면 고를 날이 없다.
// 판정은 날짜만 본다: 오늘 거래는 시각이 아직 안 왔어도 환불할 수 있다.
describe("환불할 수 있는 거래일", () => {
  const today = "2026-09-21";

  it("미래 날짜의 예정 거래는 못 한다 — 서버가 어떤 환불일로도 거절한다", () => {
    expect(isRefundableDate("2026-09-22T00:00:00", today)).toBe(false);
    expect(isRefundableDate("2026-10-01", today)).toBe(false);
  });

  it("오늘 거래는 한다", () => {
    expect(isRefundableDate("2026-09-21T08:00:00", today)).toBe(true);
  });

  it("오늘 날짜인데 시각이 아직 안 와도 한다 — 오늘을 환불일로 받는다", () => {
    expect(isRefundableDate("2026-09-21T23:59:00", today)).toBe(true);
  });

  it("지난 거래는 한다", () => {
    expect(isRefundableDate("2026-08-20T12:30:00", today)).toBe(true);
    expect(isRefundableDate("2025-12-31", today)).toBe(true);
  });
});
