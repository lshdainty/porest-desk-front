// 목록 행의 "고정" 배지 — 월급·월세처럼 매달 정해진 거래. 통계가 따로 나눠 보는 분류 표식이다.
// 환불된 거래는 합계에서 빠져 있어 "환불됨" 만 남긴다.
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

describe("고정 배지", () => {
  it("고정 거래에는 단다", () => {
    render({ ...base, isFixed: true });
    expect(text()).toContain("fixed.badge");
  });

  it("변동 거래에는 없다", () => {
    render({ ...base, isFixed: false });
    expect(text()).not.toContain("fixed.badge");
  });

  it("옛 서버가 표식을 안 주면 없다 — 기존 화면 그대로", () => {
    render(base);
    expect(text()).not.toContain("fixed.badge");
  });

  it("환불된 고정 거래는 환불됨만 남는다", () => {
    render({ ...base, isFixed: true, refundedAt: "2026-09-15T12:00:00" });
    expect(text()).toContain("refunded");
    expect(text()).not.toContain("fixed.badge");
  });
});
