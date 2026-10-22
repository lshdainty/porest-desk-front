// 이름 없는 콤보박스가 없어야 한다 — 거래 추가 시트의 선택 칸(통화 · 하위 카테고리 · 결제수단 · 자산 · 할부)은 보이는 라벨로 이름을 받는다(I-03 "이름 없는 콤보박스").
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetPointerBlockForTest } from "@/shared/lib/groo/pointer-block";
import type { ExpenseCategory } from "@/entities/expense";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const st = vi.hoisted(() => ({
  update: null as Record<string, unknown> | null,
  replace: null as { id: number; data: Record<string, unknown> } | null,
  replaceReply: { rowId: 902, refundedAmount: null } as Record<string, unknown>,
  notified: [] as { result: unknown; context: unknown }[],
  /** 교체 요청의 실패 — 있으면 onError 로 돌려준다. */
  replaceError: null as unknown,
  /** 카드 자산에 덧씌울 값 — 결제일 변경 대기 같은 경우를 만든다. */
  cardOver: {} as Record<string, unknown>,
  /** 분할 조회 상태 — 불러오는 중·실패. */
  splitsPending: false,
  splitsError: false,
  /** 편집 시트가 불러 두는 그 거래의 분할. */
  splits: [] as {
    rowId: number;
    categoryRowId: number;
    amount: number;
    label: string | null;
    sortOrder: number;
  }[],
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    // 날짜가 들어간 문장은 키 뒤에 날짜를 붙인다 — 어느 결제일을 말했는지 본다.
    t: (k: string, o?: Record<string, unknown>) =>
      o?.date != null ? `${k}|${String(o.date)}` : k,
  }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("@/features/expense", () => ({
  useExpenseCategories: () => ({
    data: [category, child, incomeCategory],
    isLoading: false,
  }),
  useExpenseTemplates: () => ({ data: [], isLoading: false }),
  useCreateExpense: () => ({ mutate: () => {}, isPending: false }),
  useUpdateExpense: () => ({
    mutate: (
      { data }: { id: number; data: Record<string, unknown> },
      opts?: { onSuccess?: (r: unknown) => void },
    ) => {
      st.update = data;
      opts?.onSuccess?.({ refundedAmount: null });
    },
    isPending: false,
  }),
  useReplaceExpense: () => ({
    mutate: (
      vars: { id: number; data: Record<string, unknown> },
      opts?: {
        onSuccess?: (r: unknown) => void;
        onError?: (e: unknown) => void;
      },
    ) => {
      st.replace = vars;
      if (st.replaceError != null) opts?.onError?.(st.replaceError);
      else opts?.onSuccess?.(st.replaceReply);
    },
    isPending: false,
  }),
  useLedgerResultToast:
    () =>
    (result: unknown, context: unknown = {}) =>
      st.notified.push({ result, context }),
  useCreateExpenseTemplate: () => ({ mutate: () => {}, isPending: false }),
  useTouchExpenseTemplate: () => ({ mutate: () => {}, isPending: false }),
}));
vi.mock("@/features/asset", () => ({
  useAssets: () => ({
    data: { assets: [{ ...card, ...st.cardOver }] },
    isLoading: false,
  }),
  useCreateTransfer: () => ({ mutate: () => {}, isPending: false }),
  useUpdateTransfer: () => ({ mutate: () => {}, isPending: false }),
}));
vi.mock("@/features/sms", () => ({
  SmsPasteField: () => <div>sms-paste</div>,
  useCommitSms: () => ({ mutate: () => {}, isPending: false }),
}));
vi.mock("@/features/expense-split", () => ({
  useExpenseSplits: (id: number | null) =>
    id == null || st.splitsPending
      ? { data: undefined, isPending: true, isError: false }
      : st.splitsError
        ? { data: undefined, isPending: false, isError: true }
        : { data: st.splits, isPending: false, isError: false },
}));
vi.mock("@/features/expense-split/ui/SplitTxDialog", () => ({
  SplitTxDialog: () => <div>split-reconcile</div>,
}));
vi.mock("@/features/user", () => ({ useDefaultCurrency: () => "KRW" }));

const category: ExpenseCategory = {
  rowId: 11,
  categoryName: "식비",
  icon: null,
  color: "#2c70bf",
  expenseType: "EXPENSE",
  sortOrder: 0,
  parentRowId: null,
  hasChildren: true,
  createAt: "2026-01-01T00:00:00",
  modifyAt: "2026-01-01T00:00:00",
};
const incomeCategory: ExpenseCategory = {
  ...category,
  rowId: 21,
  categoryName: "캐시백",
  expenseType: "INCOME",
};

/** 결제일 12일 신용카드. 8월 회차까지 결제가 끝났다(오늘 9월). */
const card = {
  rowId: 9,
  assetName: "숲길카드",
  assetType: "CREDIT_CARD",
  paymentDay: 12,
  paymentAssetRowId: 1,
  cardClosedThrough: "2026-08-31",
  balance: -12_000,
  isIncludedInTotal: "Y",
  sortOrder: 0,
};

const child: ExpenseCategory = {
  ...category,
  rowId: 12,
  categoryName: "외식",
  parentRowId: 11,
  hasChildren: false,
};

const { AddTxSheet } = await import("./AddTxSheet");

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  __resetPointerBlockForTest();
  st.cardOver = {};
  const proto = window.HTMLElement.prototype as unknown as Record<
    string,
    unknown
  >;
  proto.hasPointerCapture = () => false;
  proto.setPointerCapture = () => {};
  proto.releasePointerCapture = () => {};
  proto.scrollIntoView = () => {};
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

/** aria-labelledby · aria-label 로 푼 이름 — 참조한 요소의 글을 이어 붙인다 */
function nameOf(el: Element): string {
  const labelledby = el.getAttribute("aria-labelledby");
  if (labelledby) {
    return labelledby
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent ?? "")
      .join(" ")
      .trim();
  }
  return (el.getAttribute("aria-label") ?? "").trim();
}

describe("거래 추가 시트의 선택 칸 이름", () => {
  it("모든 콤보박스가 이름을 가진다 — 통화 · 하위 카테고리 · 결제수단 · 자산 · 할부", () => {
    act(() =>
      root.render(
        <AddTxSheet
          onClose={() => {}}
          mobile={false}
          expense={{
            rowId: 501,
            categoryRowId: 12,
            assetRowId: 9,
            assetName: "숲길카드",
            expenseType: "EXPENSE",
            amount: 12_000,
            description: "점심",
            expenseDate: "2026-08-20T12:30:00",
            merchant: "숲길분식",
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
            moneyLocked: false,
            createAt: "2026-08-20T12:30:00",
            modifyAt: "2026-08-20T12:30:00",
          }}
        />,
      ),
    );
    const boxes = [...document.body.querySelectorAll("[role=combobox]")];
    // 통화 · 하위 카테고리 · 결제수단 · 자산 · 할부
    expect(boxes.length).toBeGreaterThanOrEqual(5);
    for (const box of boxes) {
      expect(nameOf(box), box.outerHTML.slice(0, 160)).not.toBe("");
    }
    // 이름에 라벨 글이 들어간다(i18n 키가 그대로 나온다)
    const names = boxes.map(nameOf);
    expect(names.some((n) => n.includes("addTx.currency"))).toBe(true);
    expect(names.some((n) => n.includes("paymentMethodLabel"))).toBe(true);
    expect(names.some((n) => n.includes("addTx.installment"))).toBe(true);
    expect(names.some((n) => n.includes("category"))).toBe(true);
  });
});
