// 환불 금액 상한을 폼에서 잠근다 (QA #152).
//
// 사용자 결정은 "환불은 원거래 금액보다 작거나 같아야 한다" 다. 그런데 상한은
// **원거래 금액이 아니라 `원거래 금액 − 이미 환불된 금액`** 이다 — 원거래 금액을
// 그대로 쓰면 13,000원 지출에 8,000원 환불을 두 번 받아 합이 원거래를 넘는다.
// 환불은 통계에서 지출을 상계하므로, 넘어서는 순간 그 지출이 마이너스로 뒤집힌다.
//
// 잠그는 방식은 금액 칸 공통(QA #130)과 같다 — 초과 입력은 토스트로 알리고 그 값으로
// 맞춘다. 그래서 여기서 보는 건 셋이다.
//   ① 남은 금액으로 맞춰진다(전액 환불 안 된 거래 · 일부 환불된 거래)
//   ② **경계값은 통과한다** — 정확히 상한이면 깎이지도, 저장이 닫히지도 않는다
//   ③ 환불이 아닌 거래에는 이 상한이 안 걸린다 — 안 그러면 100억 칸이 조용히 좁아진다
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { __resetPointerBlockForTest } from "@/shared/lib/porest/pointer-block";
import type { Expense, ExpenseCategory } from "@/entities/expense";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const sent = vi.hoisted(() => ({
  create: null as Record<string, unknown> | null,
}));

// 안내가 나갔는지만 본다 — 문구는 CSV 가 정하고 `amount.test.ts` 가 이미 잠근다.
vi.mock("sonner", () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("@/features/expense", () => ({
  useExpenseCategories: () => ({ data: state.categories, isLoading: false }),
  useExpenseTemplates: () => ({ data: [], isLoading: false }),
  useCreateExpense: () => ({
    mutate: (data: Record<string, unknown>) => {
      sent.create = data;
    },
    isPending: false,
  }),
  useUpdateExpense: () => ({ mutate: () => {}, isPending: false }),
  useCreateExpenseTemplate: () => ({ mutate: () => {}, isPending: false }),
  useTouchExpenseTemplate: () => ({ mutate: () => {}, isPending: false }),
}));
vi.mock("@/features/asset", () => ({
  useAssets: () => ({ data: { assets: [] }, isLoading: false }),
  useCreateTransfer: () => ({ mutate: () => {}, isPending: false }),
  useUpdateTransfer: () => ({ mutate: () => {}, isPending: false }),
}));
vi.mock("@/features/sms", () => ({
  SmsPasteField: () => null,
  useCommitSms: () => ({ mutate: () => {}, isPending: false }),
}));
vi.mock("@/features/expense-split", () => ({
  useExpenseSplits: () => ({ data: [], isPending: false, isError: false }),
}));
vi.mock("@/features/expense-split/ui/SplitTxDialog", () => ({
  SplitTxDialog: () => null,
}));
vi.mock("@/features/user", () => ({
  useDefaultCurrency: () => "KRW",
}));

const category: ExpenseCategory = {
  rowId: 11,
  categoryName: "식비",
  icon: null,
  color: "#2c70bf",
  expenseType: "EXPENSE",
  sortOrder: 0,
  parentRowId: null,
  hasChildren: false,
  createAt: "2026-01-01T00:00:00",
  modifyAt: "2026-01-01T00:00:00",
};

/** 환불은 수입으로 들어간다 — 수입 카테고리가 없으면 분류가 비어 저장이 안 열린다. */
const incomeCategory: ExpenseCategory = {
  ...category,
  rowId: 21,
  categoryName: "환불",
  expenseType: "INCOME",
};

const state = { categories: [category, incomeCategory] as ExpenseCategory[] };

/** 13,000원 지출 — QA 가 99,999원을 넣어 본 그 거래다. */
const original: Expense = {
  rowId: 501,
  categoryRowId: 21,
  assetRowId: null,
  assetName: null,
  expenseType: "EXPENSE",
  amount: 13_000,
  description: "점심",
  expenseDate: "2026-09-05T12:30:00",
  merchant: "김밥천국",
  paymentMethod: "CARD",
  installmentMonths: null,
  refundOfExpenseRowId: null,
  originalAmount: null,
  originalCurrency: null,
  exchangeRate: null,
  calendarEventRowId: null,
  todoRowId: null,
  autoSource: null,
  refundCount: 0,
  refundedAmount: 0,
  createAt: "2026-09-05T12:30:00",
  modifyAt: "2026-09-05T12:30:00",
};

const { AddTxSheet } = await import("./AddTxSheet");

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  __resetPointerBlockForTest();
  sent.create = null;
  vi.mocked(toast.info).mockClear();
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render(props: { refundOf?: Expense | null } = {}) {
  act(() =>
    root.render(
      <AddTxSheet
        onClose={() => {}}
        mobile={false}
        refundOf={props.refundOf ?? null}
      />,
    ),
  );
}

/** 금액 칸 — `inputMode="numeric"` 을 쓰는 칸은 이 시트에 하나다. */
function amountInput(): HTMLInputElement {
  const el = document.body.querySelector<HTMLInputElement>(
    'input[inputmode="numeric"]',
  );
  if (!el) throw new Error("금액 칸을 찾지 못했다");
  return el;
}

/** 리액트가 관리하는 입력에 값을 넣는다(setter 를 우회하면 상태가 안 바뀐다). */
function setValue(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;
  act(() => {
    setter?.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function saveButton(): HTMLButtonElement {
  const el = [...document.body.querySelectorAll("button")].find((b) =>
    ["save", "addTx.add"].includes(b.textContent?.trim() ?? ""),
  );
  if (!el) throw new Error("저장 버튼을 찾지 못했다");
  return el;
}

const clickSave = () =>
  act(() =>
    saveButton().dispatchEvent(new MouseEvent("click", { bubbles: true })),
  );

describe("환불 금액 상한 (QA #152)", () => {
  it("원거래보다 큰 금액은 원거래 금액으로 맞춰진다 — 13,000원에 99,999원", () => {
    render({ refundOf: original });

    setValue(amountInput(), "99999");

    expect(amountInput().value).toBe("13000");
    expect(toast.info).toHaveBeenCalled();
  });

  it("이미 환불된 만큼을 뺀 금액이 상한이다 — 원거래 금액이 아니다", () => {
    // 13,000원 중 5,000원을 이미 환불했다 → 남은 상한은 8,000원.
    render({
      refundOf: { ...original, refundCount: 1, refundedAmount: 5_000 },
    });

    setValue(amountInput(), "9000");

    expect(amountInput().value).toBe("8000");
    // 원거래 금액(13,000)으로 맞췄다면 여기서 걸린다.
    expect(amountInput().value).not.toBe("13000");
  });

  it("기본값도 남은 금액이다 — 열자마자 상한을 넘긴 값으로 시작하지 않는다", () => {
    render({
      refundOf: { ...original, refundCount: 1, refundedAmount: 5_000 },
    });

    expect(amountInput().value).toBe("8000");
  });

  it("경계 — 정확히 남은 금액이면 깎이지 않고 저장도 열린다", () => {
    render({
      refundOf: { ...original, refundCount: 1, refundedAmount: 5_000 },
    });

    setValue(amountInput(), "8000");

    expect(amountInput().value).toBe("8000");
    expect(toast.info).not.toHaveBeenCalled();
    expect(saveButton().disabled).toBe(false);

    clickSave();
    expect(sent.create).not.toBeNull();
    expect(sent.create!.amount).toBe(8000);
    expect(sent.create!.refundOfExpenseRowId).toBe(501);
  });

  it("경계 — 남은 금액보다 1원 많으면 그 값으로 맞춰진다", () => {
    render({
      refundOf: { ...original, refundCount: 1, refundedAmount: 5_000 },
    });

    setValue(amountInput(), "8001");

    expect(amountInput().value).toBe("8000");
    expect(toast.info).toHaveBeenCalled();
  });

  it("이미 전액 환불된 거래 — 금액 칸이 잠기고 저장도 안 열린다", () => {
    render({
      refundOf: { ...original, refundCount: 2, refundedAmount: 13_000 },
    });

    expect(amountInput().value).toBe("");
    expect(amountInput().disabled).toBe(true);
    expect(saveButton().disabled).toBe(true);

    clickSave();
    expect(sent.create).toBeNull();
  });

  it("환불이 아닌 거래에는 안 걸린다 — 금액 칸은 100억까지 그대로다", () => {
    render();

    setValue(amountInput(), "9999999999");

    expect(amountInput().value).toBe("9999999999");
    expect(toast.info).not.toHaveBeenCalled();
  });
});
