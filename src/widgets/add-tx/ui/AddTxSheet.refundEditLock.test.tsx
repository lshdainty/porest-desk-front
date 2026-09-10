// 환불 행은 금액을 못 고친다.
//
// 사용자 결정은 **"환불은 만들고 취소하는 것이지 고치는 게 아니다"** 다. 금액이
// 틀렸으면 환불을 지우고 다시 넣는다. "환불 편집" 은 설계된 적이 없는데도
// 환불 행이 DB 상 평범한 수입 행(`INCOME` + `refundOfExpenseRowId`)이라 가계부
// 목록에 섞이고, 모든 거래에 붙는 수정 버튼을 똑같이 받아 금액 칸이 열려 있었다.
//
// 그래서 여기서 보는 건 **잠금 하나와 반대편 셋**이다 — 잠금만 잠그면 다음 리팩터가
// 조건을 넓혀도 아무도 모른다. 과잉 차단이 더 나쁜 고장이다.
//   ① 환불 행을 편집하면 금액 칸이 잠기고 **이유가 보인다**
//   ② 평범한 수입 행(원거래 연결 없음)은 그대로 열린다
//   ③ **새 환불을 만드는 모드**는 금액을 쳐야 한다 — 상한(#379)만 걸린다
//   ④ 환불이 달린 **원거래**(EXPENSE)도 그대로 열린다 — 환불 행이 아니다
// 그리고 잠근 게 칸 하나뿐임을 못박는다 — 메모·날짜는 여전히 고쳐 저장된다.
//
// 잠금은 `disabled` 로 본다 — 잠긴 칸에 값을 **프로그램으로** 밀어 넣어 보는 검사는
// 브라우저를 모사하지 못한다(jsdom 의 `dispatchEvent` 는 `disabled` 를 안 보고
// 리액트도 input 이벤트를 안 거른다). 대신 `disabled` 가 안 막는 경로를 따로 본다 —
// 해외 결제 환산은 `setAmount` 를 직접 부르므로 칸을 닫는 것만으로는 안 막힌다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetPointerBlockForTest } from "@/shared/lib/porest/pointer-block";
import type { Expense, ExpenseCategory } from "@/entities/expense";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const sent = vi.hoisted(() => ({
  create: null as Record<string, unknown> | null,
  update: null as Record<string, unknown> | null,
}));

vi.mock("sonner", () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "ko" } }),
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
  useUpdateExpense: () => ({
    mutate: ({ data }: { id: number; data: Record<string, unknown> }) => {
      sent.update = data;
    },
    isPending: false,
  }),
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

const base: Expense = {
  rowId: 501,
  categoryRowId: 11,
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

/** 13,000원 지출에 5,000원을 환불받은 그 행 — `INCOME` + 원거래 연결. */
const refundRow: Expense = {
  ...base,
  rowId: 777,
  categoryRowId: 21,
  expenseType: "INCOME",
  amount: 5_000,
  description: "환불",
  refundOfExpenseRowId: 501,
};

/**
 * 새 환불을 만들 때 넘기는 원거래.
 *
 * 카테고리를 **수입 쪽으로** 둔다 — 환불은 수입으로 들어가고, 시트는 종류와 안 맞는
 * 카테고리를 비운다(`AddTxSheet.tsx:492`). 지출 카테고리를 물려주면 분류가 빈 채로
 * 열려 저장이 안 열리고, 잠금과 무관한 이유로 테스트가 붉어진다.
 */
const refundTarget: Expense = { ...base, categoryRowId: 21 };

/** 원거래 연결이 없는 평범한 수입 — 환불과 한 글자 차이라 여기서 갈린다. */
const plainIncome: Expense = {
  ...refundRow,
  rowId: 778,
  description: "용돈",
  refundOfExpenseRowId: null,
};

const { AddTxSheet } = await import("./AddTxSheet");

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  __resetPointerBlockForTest();
  sent.create = null;
  sent.update = null;
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

function render(
  props: { expense?: Expense | null; refundOf?: Expense | null } = {},
) {
  act(() =>
    root.render(
      <AddTxSheet
        onClose={() => {}}
        mobile={false}
        expense={props.expense ?? null}
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

/** 날짜 칸 — `InputDatePicker` 가 그리는 평범한 텍스트 인풋. */
function dateInput(): HTMLInputElement {
  const el = document.body.querySelector<HTMLInputElement>(
    'input[placeholder="yyyy-mm-dd"]',
  );
  if (!el) throw new Error("날짜 칸을 찾지 못했다");
  return el;
}

/** 메모 칸 — 이 시트의 textarea 는 하나다. */
function memoInput(): HTMLTextAreaElement {
  const el = document.body.querySelector("textarea");
  if (!el) throw new Error("메모 칸을 찾지 못했다");
  return el;
}

/** 원 통화 금액 칸 — `inputMode="decimal"` 첫 칸(해외 결제일 때만 그려진다). */
function origAmountInput(): HTMLInputElement {
  const el = document.body.querySelector<HTMLInputElement>(
    'input[inputmode="decimal"]',
  );
  if (!el) throw new Error("원 통화 금액 칸을 찾지 못했다");
  return el;
}

/** 리액트가 관리하는 입력에 값을 넣는다(setter 를 우회하면 상태가 안 바뀐다). */
function setValue(
  el: HTMLInputElement | HTMLTextAreaElement,
  value: string,
): void {
  const proto =
    el instanceof HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
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

describe("환불 행 편집 — 금액만 잠근다", () => {
  it("환불 행을 편집하면 금액 칸이 잠기고 이유가 보인다", () => {
    render({ expense: refundRow });

    expect(amountInput().disabled).toBe(true);
    expect(document.body.textContent).toContain("addTx.refundAmountLocked");
  });

  it("해외 결제 환산으로도 금액이 안 움직인다 — 이 경로는 setAmount 를 직접 부른다", () => {
    // $5 × 1,300 = 6,500원으로 적힌 환불 행. 원 통화 금액을 $50 으로 고쳐도
    // 원화 금액은 그대로여야 한다(칸을 닫는 것만으로는 이 경로가 안 막힌다).
    render({
      expense: {
        ...refundRow,
        amount: 6_500,
        originalAmount: 5,
        originalCurrency: "USD",
        exchangeRate: 1_300,
      },
    });

    expect(amountInput().value).toBe("6500");

    setValue(origAmountInput(), "50");

    expect(amountInput().value).toBe("6500");
  });

  it("메모·날짜는 여전히 고칠 수 있다 — 잠근 건 금액 하나다", () => {
    render({ expense: refundRow });

    expect(memoInput().disabled).toBe(false);
    expect(dateInput().disabled).toBe(false);

    setValue(memoInput(), "카드사 취소 확인");
    setValue(dateInput(), "2026-09-09");

    clickSave();
    expect(sent.update).not.toBeNull();
    expect(sent.update!.description).toBe("카드사 취소 확인");
    expect(sent.update!.expenseDate).toBe("2026-09-09T12:30");
    // 금액은 원래 값 그대로 — 메모를 고친다고 금액이 흔들리지 않는다.
    expect(sent.update!.amount).toBe(5000);
  });

  // 삭제는 이 시트가 아니라 거래 상세에 있다 — 그쪽은 손대지 않았고,
  // 남아 있는지는 `TxDetailDialog.refund.test.tsx` 가 본다.

  // ── 반대편: 과잉 차단을 막는다 ──────────────────────────────────────────

  it("평범한 수입 행은 그대로 열린다 — 원거래 연결이 없으면 환불이 아니다", () => {
    render({ expense: plainIncome });

    expect(amountInput().disabled).toBe(false);
    expect(document.body.textContent).not.toContain("addTx.refundAmountLocked");

    setValue(amountInput(), "7000");

    expect(amountInput().value).toBe("7000");

    clickSave();
    expect(sent.update).not.toBeNull();
    expect(sent.update!.amount).toBe(7000);
  });

  it("새 환불을 만드는 모드는 금액을 칠 수 있다 — 상한(#379)만 걸린다", () => {
    render({ refundOf: refundTarget });

    expect(amountInput().disabled).toBe(false);
    expect(document.body.textContent).not.toContain("addTx.refundAmountLocked");

    setValue(amountInput(), "3000");
    expect(amountInput().value).toBe("3000");

    // 상한은 그대로 — 원거래(13,000)를 넘기면 남은 금액으로 맞춰진다.
    setValue(amountInput(), "99999");
    expect(amountInput().value).toBe("13000");

    clickSave();
    expect(sent.create).not.toBeNull();
    expect(sent.create!.amount).toBe(13000);
    expect(sent.create!.refundOfExpenseRowId).toBe(501);
  });

  it("환불이 달린 원거래도 그대로 열린다 — 환불받은 쪽은 환불 행이 아니다", () => {
    render({ expense: { ...base, refundCount: 1, refundedAmount: 5_000 } });

    expect(amountInput().disabled).toBe(false);
    expect(document.body.textContent).not.toContain("addTx.refundAmountLocked");

    setValue(amountInput(), "14000");

    expect(amountInput().value).toBe("14000");
  });
});
