// 거래 줄 = ds List 줄(I-06 28) · 가림 카드는 호출부가 정한다(I-06 29)
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
const { setHiddenCards } = await import("@/shared/lib/groo/hide-amounts-core");

const base: Expense = {
  rowId: 1,
  categoryRowId: 11,
  categoryName: "식비",
  assetRowId: 9,
  assetName: "통장",
  expenseType: "EXPENSE",
  amount: 1_234_567_890,
  description: null,
  merchant: "카페 · 간식 · 디저트 모임 지출 항목이 아주 긴 가게",
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
  act(() => setHiddenCards([]));
  act(() => root.unmount());
  container.remove();
});

const render = (e: Expense, props: object = {}) =>
  act(() => root.render(<ExpenseRow expense={e} {...props} />));
const q = (sel: string) => container.querySelector<HTMLElement>(sel);

describe("거래 줄 — ds List", () => {
  it("제목은 줄을 바꾸고(말줄임 0) 설명만 한 줄 말줄임이다", () => {
    render(base);
    expect(q("[data-slot=list-title]")?.textContent).toContain("아주 긴 가게");
    expect(q("[data-slot=list-title]")?.innerHTML).not.toContain("truncate");
    expect(q("[data-slot=tag-group]")?.className).toContain(
      "whitespace-nowrap",
    );
    expect(q("[data-slot=tag-group-item-label]")?.className).toContain(
      "truncate",
    );
  });

  it("앞 타일 40 · 모서리 r3 · 줄 전체가 버튼", () => {
    render(base, { onClick: () => {} });
    expect(q("[data-slot=list-tile]")?.className).toMatch(
      /size-x10.*rounded-r3/,
    );
    expect(q("button[data-slot=list-body]")).not.toBeNull();
  });

  it("지출 금액은 fg-neutral, 수입만 fg-brand + 부호", () => {
    render(base);
    expect(q("[data-slot=list-suffix] span")?.className).toContain(
      "text-fg-neutral",
    );
    render({ ...base, expenseType: "INCOME" });
    const amt = q("[data-slot=list-suffix] span");
    expect(amt?.className).toContain("text-fg-brand");
    expect(amt?.textContent).toContain("+");
  });

  it("환불 줄은 흐림(opacity) 없이 금액만 subtle + 취소선", () => {
    render({ ...base, refundedAt: "2026-08-21T10:00:00" });
    expect(container.innerHTML).not.toContain("opacity-60");
    expect(q("[data-slot=list-suffix] span")?.className).toContain(
      "text-fg-neutral-subtle",
    );
    expect(container.querySelector(".line-through")).not.toBeNull();
  });
});

describe("가림 카드(I-06 29)", () => {
  it("home.todaySpend 만 켜면 홈 줄은 가려지고 가계부 줄은 그대로다", () => {
    act(() => setHiddenCards(["home.todaySpend"]));
    render(base, { maskCard: "home.todaySpend" });
    expect(container.textContent).toContain("••••");
    render(base);
    expect(container.textContent).not.toContain("••••");
  });

  it("ledger.txList 만 켜면 가계부 줄은 가려지고 홈 줄은 보인다", () => {
    act(() => setHiddenCards(["ledger.txList"]));
    render(base);
    expect(container.textContent).toContain("••••");
    render(base, { maskCard: "home.todaySpend" });
    expect(container.textContent).not.toContain("••••");
  });
});
