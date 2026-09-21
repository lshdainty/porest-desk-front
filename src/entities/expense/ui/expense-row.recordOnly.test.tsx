// 목록 행의 "기록만" 배지 — 결제가 끝난 회차에 뒤늦게 적은 카드 지출(닫힌 회차 R2).
// 합계에는 들어가므로 흐리지 않고 배지만 단다. 환불된 거래에는 "환불됨" 만 남긴다.
// **통째로 기록용인 거래에만** 단다(D10) — 할부가 닫힌·열린 회차에 걸쳐 일부만 기록용이면
// 행 배지는 거짓이 된다(상세가 "이 중 N원" 으로 말한다).
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Expense } from "../model/types";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "ko" } }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

const { ExpenseRow } = await import("./expense-row");

const base: Expense = {
  rowId: 1,
  categoryRowId: 11,
  categoryName: "식비",
  assetRowId: 9,
  assetName: "현대카드",
  expenseType: "EXPENSE",
  amount: 25_000,
  description: null,
  merchant: "가맹점",
  expenseDate: "2026-08-20T10:00:00",
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
  createAt: "2026-09-14T10:00:00",
  modifyAt: "2026-09-14T10:00:00",
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const render = (e: Expense) =>
  act(() => root.render(<ExpenseRow expense={e} />));
const text = () => container.textContent ?? "";

describe("기록만 배지", () => {
  it("표식이 있으면 단다", () => {
    render({ ...base, cardSettledThrough: "2026-08-31" });
    expect(text()).toContain("recordOnly");
  });

  it("기록만 남긴 금액이 거래 금액과 같을 때만 단다", () => {
    render({
      ...base,
      cardSettledThrough: "2026-08-31",
      recordOnlyAmount: 25_000,
    });
    expect(text()).toContain("recordOnly");
  });

  it("할부의 지난 회차분만 기록용이면 행엔 안 단다 — 나머지는 정상 청구다", () => {
    render({
      ...base,
      amount: 90_000,
      installmentMonths: 3,
      cardSettledThrough: "2026-08-31",
      recordOnlyAmount: 30_000,
    });
    expect(text()).not.toContain("recordOnly");
  });

  it("정상 거래에는 없다", () => {
    render(base);
    expect(text()).not.toContain("recordOnly");
  });

  it("환불된 거래는 환불됨만 — 합계에서 빠진 쪽이 먼저다", () => {
    render({
      ...base,
      cardSettledThrough: "2026-08-31",
      refundedAt: "2026-09-15T12:00:00",
    });
    expect(text()).toContain("refunded");
    expect(text()).not.toContain("recordOnly");
  });
});
