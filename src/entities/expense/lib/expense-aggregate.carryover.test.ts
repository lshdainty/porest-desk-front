// 카드 이월 거래는 **가계부 합계에서만** 빠진다(D4 후속 결정, 2026-09-18).
//
// 카드를 만들 때 적은 "이전 미결제 사용액" 은 앱을 쓰기 전에 이미 쓴 돈이다. 그걸 지출
// 합계에 세면 카드를 등록한 달만 몇십만 원이 솟는다 — 그 달에 쓴 돈이 아니다.
//
// 반대로 카드 숫자(청구 예정·한도 사용)에서는 빼면 안 된다. 그 거래가 곧 카드의 미결제
// 잔액이라 빼는 순간 D4("잔액 = 거래 합")가 풀린다. 다행히 카드 숫자는 서버가 내려 주므로
// 이 파일이 건드리는 것은 가계부 쪽뿐이다 — 여기서 잠그는 건 그 경계다.
import { describe, expect, it } from "vitest";
import type { Expense } from "../model/types";
import {
  countableTx,
  expenseSum,
  isCardCarryoverTx,
} from "./expense-aggregate";

function tx(over: Partial<Expense>): Expense {
  return {
    rowId: 1,
    categoryRowId: null,
    assetRowId: 9,
    assetName: "현대카드",
    expenseType: "EXPENSE",
    amount: 12_000,
    description: null,
    merchant: "가맹점",
    expenseDate: "2026-09-10T12:00:00",
    paymentMethod: "CARD",
    installmentMonths: null,
    refundedAt: null,
    refundTransferRowId: null,
    originalAmount: null,
    originalCurrency: null,
    exchangeRate: null,
    calendarEventRowId: null,
    todoRowId: null,
    autoSource: null,
    createAt: "2026-09-10T12:00:00",
    modifyAt: "2026-09-10T12:00:00",
    ...over,
  } as Expense;
}

const carryover = tx({
  rowId: 2,
  amount: 300_000,
  autoSource: "CARD_CARRYOVER",
  merchant: "이전 미결제 사용액",
});

describe("카드 이월은 가계부 합계에서 빠진다", () => {
  it("이월 30만이 있어도 그 달 지출은 12,000 이다", () => {
    expect(expenseSum([tx({}), carryover])).toBe(12_000);
  });

  it("집계 목록에서도 빠진다 — 일별 헤더·월 합계가 같은 함수를 쓴다", () => {
    expect(countableTx([tx({}), carryover]).map((e) => e.rowId)).toEqual([1]);
  });

  it("다른 시스템 거래는 그대로 센다 — 이월만 빼는 규칙이다", () => {
    // 자동 생성 전부를 빼면 매도 실현손익·이체 이자가 합계에서 사라진다.
    const realized = tx({
      rowId: 3,
      amount: 5_000,
      autoSource: "TRADE_REALIZED",
    });
    expect(expenseSum([realized])).toBe(5_000);
    expect(isCardCarryoverTx(realized)).toBe(false);
  });

  it("판정은 autoSource 하나다", () => {
    expect(isCardCarryoverTx(carryover)).toBe(true);
    expect(isCardCarryoverTx(tx({}))).toBe(false);
  });
});
