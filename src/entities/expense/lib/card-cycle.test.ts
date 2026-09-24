import { describe, expect, it } from "vitest";
import {
  cardCyclePaymentDate,
  closedCycleSpan,
  cyclePaymentDate,
  pendingBillWindow,
  pendingCycleOnOldDay,
} from "./card-cycle";

// 서버 `CardCycleMath.paymentDateOf` 와 같은 규칙이어야 한다 — 고쳐 쓰기 확인창이 "언제
// 결제에 청구되는지" 를 이 값으로 말한다(계약 10).
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

// 결제일 변경이 대기 중인 카드 — 25일 카드를 9/21 에 21일로, 다시 10일로 바꿨다. 8월분은
// 처음 결제일인 9/25 에 결제되고(서버 이력, `nextPaymentDate`), 9월분부터 10일이다(D5).
describe("회차가 실제로 결제되는 날", () => {
  it("대기 중인 회차에 든 날짜는 서버가 준 결제일이다 — 지금 결제일로 세지 않는다", () => {
    expect(cyclePaymentDate("2026-08-28", 10, "2026-09-25")).toBe("2026-09-25");
  });

  it("그 뒤 회차는 지금 결제일로 센다", () => {
    expect(cyclePaymentDate("2026-09-05", 10, "2026-09-25")).toBe("2026-10-10");
  });

  it("서버 값이 없으면(옛 서버) 지금 결제일로 센다", () => {
    expect(cyclePaymentDate("2026-08-28", 10, null)).toBe("2026-09-10");
    expect(cyclePaymentDate("2026-08-28", 10)).toBe("2026-09-10");
  });
});

// 닫힌 회차 판정은 서버가 내려 준 `cardClosedThrough` 와 날짜만 견준다 — 화면이 회차를 다시
// 세면 결제일을 바꾼 카드(D5)·서울 시계(D11)에서 서버와 갈린다.
describe("닫힌 회차에 걸렸나", () => {
  it("그 날짜 이하 거래는 닫힌 회차다 — 말일 당일도", () => {
    expect(closedCycleSpan("2026-08-20T10:00:00", null, "2026-08-31")).toBe(
      "closed",
    );
    expect(closedCycleSpan("2026-08-31", null, "2026-08-31")).toBe("closed");
  });

  it("그 뒤 거래는 열린 회차다", () => {
    expect(closedCycleSpan("2026-09-01", null, "2026-08-31")).toBeNull();
  });

  it("닫힌 회차가 없는 카드·신용카드 아님(null)은 늘 열린 회차다", () => {
    expect(closedCycleSpan("2020-01-01", null, null)).toBeNull();
    expect(closedCycleSpan("2020-01-01", null, undefined)).toBeNull();
  });

  it("할부가 닫힌 회차와 열린 회차에 걸치면 '지난 회차분만'", () => {
    // 7월 시작 3개월 = 7·8·9월 회차. 8월까지 닫혔으면 9월분이 남는다.
    expect(closedCycleSpan("2026-07-15", 3, "2026-08-31")).toBe("partial");
  });

  it("할부의 마지막 회차까지 닫혔으면 통째로 닫힌 회차다", () => {
    expect(closedCycleSpan("2026-06-15", 3, "2026-08-31")).toBe("closed");
  });

  it("할부 개월 1 은 일시불이다", () => {
    expect(closedCycleSpan("2026-08-15", 1, "2026-08-31")).toBe("closed");
  });

  it("해를 넘기는 할부도 센다", () => {
    // 11월 시작 3개월 = 11·12·1월 회차.
    expect(closedCycleSpan("2025-11-10", 3, "2025-12-31")).toBe("partial");
    expect(closedCycleSpan("2025-11-10", 3, "2026-01-31")).toBe("closed");
  });
});

// 결제일을 바꿔도 아직 결제 전인 회차는 옛 결제일에 결제된다(D5).
describe("옛 결제일로 결제되는 회차", () => {
  it("닫힌 회차 다음 달 회차다", () => {
    // 8월분이 9/12 에 결제됐다(닫힘). 9월분은 옛 결제일 10/12 에 결제된다.
    expect(pendingCycleOnOldDay(12, "2026-08-31", "2026-09-21")).toEqual({
      month: "2026-09",
      paymentDate: "2026-10-12",
    });
  });

  it("닫힌 회차가 없으면 오늘 기준 결제일이 아직 안 온 회차다", () => {
    // 오늘 9/21, 결제일 25 → 8월분이 9/25 에 아직 남았다.
    expect(pendingCycleOnOldDay(25, null, "2026-09-21")).toEqual({
      month: "2026-08",
      paymentDate: "2026-09-25",
    });
  });

  it("서버가 다음 결제일을 주면 그 날과 그 회차의 달이다 — 결제일을 두 번 바꿔도 맞다", () => {
    // 25 → 21(오늘) → 10: 지금 결제일은 21 이지만 8월분은 처음 결제일인 9/25 에 나간다.
    expect(
      pendingCycleOnOldDay(21, "2026-07-31", "2026-09-21", "2026-09-25"),
    ).toEqual({ month: "2026-08", paymentDate: "2026-09-25" });
  });

  it("결제일 당일이면 그 회차는 이미 닫혔다 — 다음 회차다", () => {
    expect(pendingCycleOnOldDay(21, null, "2026-09-21")).toEqual({
      month: "2026-09",
      paymentDate: "2026-10-21",
    });
  });
});

// 새 카드의 결제 대기 청구분 칸(2026-09-22 사용자 결정) — 서버 `dueCycleFor` 와 같은 규칙이다.
// 오늘이 이번 달 결제일 전이면 지난달 회차가 결제를 기다린다. 결제일 당일부터는 닫혔다(D2).
describe("pendingBillWindow", () => {
  it("9/10 · 결제일 12일 — 지난달 청구분은 9/12, 그 뒤 쓴 금액은 10/12 에 결제된다", () => {
    expect(pendingBillWindow("2026-09-10", 12)).toEqual({
      dueDate: "2026-09-12",
      afterDate: "2026-10-12",
    });
  });

  it("결제일 당일·그 뒤면 기다리는 청구분이 없다", () => {
    expect(pendingBillWindow("2026-09-12", 12)).toBeNull();
    expect(pendingBillWindow("2026-09-20", 12)).toBeNull();
  });

  it("그 달에 없는 결제일은 말일 — 9월(30일)의 31일 결제는 9/30, 10월은 10/31", () => {
    expect(pendingBillWindow("2026-09-10", 31)).toEqual({
      dueDate: "2026-09-30",
      afterDate: "2026-10-31",
    });
  });

  it("해가 바뀌어도 센다 — 1/5 · 결제일 20일", () => {
    expect(pendingBillWindow("2027-01-05", 20)).toEqual({
      dueDate: "2027-01-20",
      afterDate: "2027-02-20",
    });
  });

  it("결제일이 없으면 칸이 없다", () => {
    expect(pendingBillWindow("2026-09-10", null)).toBeNull();
    expect(pendingBillWindow("2026-09-10", undefined)).toBeNull();
    expect(pendingBillWindow("2026-09-10", Number.NaN)).toBeNull();
  });
});
