import { describe, expect, it } from "vitest";
import { cardCyclePaymentDate, isCardCycleDue } from "./card-cycle";

// 서버 `CardCycleMath.paymentDateOf` 와 같은 규칙이어야 한다 — 어긋나면 확인창이 물어야 할
// 자리에서 안 묻거나(돈이 말없이 움직인다) 안 물어도 될 자리에서 묻는다.
describe("카드 회차 결제일", () => {
  it("거래 달의 다음 달 결제일이다", () => {
    expect(cardCyclePaymentDate("2026-08-20", 12)).toBe("2026-09-12");
  });

  it("그 달에 없는 날이면 말일이다", () => {
    expect(cardCyclePaymentDate("2027-01-10", 31)).toBe("2027-02-28");
  });

  it("12월 거래는 다음 해 1월에 결제된다", () => {
    expect(cardCyclePaymentDate("2026-12-05", 12)).toBe("2027-01-12");
  });
});

describe("저장 전에 물어볼 회차", () => {
  it("결제일이 지난 회차(닫힘)는 묻는다", () => {
    expect(isCardCycleDue("2026-08-20", 12, "2026-09-14")).toBe(true);
  });

  it("결제일 당일도 묻는다 — 그 자리에서 추가로 빠진다", () => {
    expect(isCardCycleDue("2026-08-30", 12, "2026-09-12")).toBe(true);
  });

  it("결제일 전 회차는 묻지 않는다", () => {
    expect(isCardCycleDue("2026-09-13", 12, "2026-09-14")).toBe(false);
  });
});
