// 거래 상세의 **빠른 동작 한 줄** (환불 · 내역 분할 · 반복 설정 · 더치페이).
//
// 원래 열 수가 `repeat(3, 1fr)` 로 박혀 있었다 — 셋(분할·반복·더치페이) 기준으로 쓴 값인데
// 환불이 넷째로 들어오면서 **지출 거래에서 3+1 로 줄바꿈**됐다(사용자 신고 2026-09-09).
// 그렇다고 4 로 바꿔 박으면 이번엔 **환불이 없는 수입 거래에서 한 칸이 빈다** — 환불은
// `!isIncome && onRefund` 일 때만 그려지기 때문이다. 앱은 `Row` + `Expanded` 라 개수와
// 무관하게 늘 한 줄이고, 그 모양이 기준이다.
//
// 그래서 여기서 잠그는 건 숫자 3 이나 4 가 아니라 **"열 수 = 실제로 그린 버튼 수"** 라는
// 관계다. 숫자를 박아 두면 버튼이 하나 더 늘 때 같은 자리에서 또 깨진다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Expense } from "@/entities/expense";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "ko" } }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("@/features/expense", () => ({
  useExpenseCategories: () => ({ data: [], isLoading: false }),
  useSearchExpenses: () => ({ data: [], isLoading: false }),
  useDeleteExpense: () => ({ mutate: () => {}, isPending: false }),
  useUnlinkRefund: () => ({ mutate: () => {}, isPending: false }),
}));
vi.mock("@/features/expense-split", () => ({
  useExpenseSplits: () => ({ data: [], isLoading: false }),
}));
vi.mock("@/features/recurring-transaction", () => ({
  useRecurringTransactions: () => ({ data: [], isLoading: false }),
}));
vi.mock("@/features/dutch-pay", () => ({
  useDutchPays: () => ({ data: [], isLoading: false }),
}));
vi.mock("@/features/asset", () => ({
  useAssets: () => ({ data: { assets: [] }, isLoading: false }),
}));
vi.mock("@/features/expense-split/ui/SplitTxDialog", () => ({
  SplitTxDialog: () => null,
}));
vi.mock("@/features/recurring-transaction/ui/RecurringFromTxDialog", () => ({
  RecurringFromTxDialog: () => null,
}));
vi.mock("@/features/dutch-pay/ui/DutchPayFromTxDialog", () => ({
  DutchPayFromTxDialog: () => null,
}));

const { TxDetailDialog } = await import("./TxDetailDialog");

const baseExpense: Expense = {
  rowId: 77,
  categoryRowId: 21,
  assetRowId: null,
  assetName: null,
  expenseType: "EXPENSE",
  amount: 3000,
  description: null,
  merchant: "김밥천국",
  expenseDate: "2026-09-05T12:30:00",
  paymentMethod: null,
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

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
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

/** `mobile` 은 껍데기(Drawer/Dialog)만 가른다 — 빠른 동작 줄은 둘이 같은 코드다. */
function render(
  expense: Expense,
  opts: { refundable: boolean; mobile: boolean },
) {
  act(() =>
    root.render(
      <TxDetailDialog
        expense={expense}
        mobile={opts.mobile}
        onClose={() => {}}
        onRefund={opts.refundable ? () => {} : undefined}
      />,
    ),
  );
}

/** 라벨 키가 그대로 글자로 나온다(`t` 목) — 그 버튼의 부모가 빠른 동작 줄이다. */
function quickActionRow(): HTMLElement {
  const dutch = [...document.body.querySelectorAll("button")].find(
    (b) => b.textContent?.trim() === "txDetail.dutchPay",
  );
  expect(dutch, "더치페이 버튼이 없다").not.toBeUndefined();
  return dutch!.parentElement as HTMLElement;
}

/** 한 줄이라는 것 = 그리드 열 수가 그 줄에 실제로 담긴 버튼 수와 같다는 것. */
function rowShape() {
  const row = quickActionRow();
  const labels = [...row.children].map((el) => el.textContent?.trim() ?? "");
  return { columns: row.style.gridTemplateColumns, labels };
}

describe("빠른 동작은 개수와 무관하게 한 줄이다", () => {
  it("지출 4개(환불 포함) — 열도 4다", () => {
    render(baseExpense, { refundable: true, mobile: false });

    expect(rowShape()).toEqual({
      columns: "repeat(4, 1fr)",
      labels: [
        "txDetail.refund",
        "splitTitle",
        "txDetail.recurring",
        "txDetail.dutchPay",
      ],
    });
  });

  it("수입 3개(환불 없음) — 열도 3이다. 4로 박으면 여기서 한 칸이 빈다", () => {
    render(
      { ...baseExpense, expenseType: "INCOME" },
      { refundable: true, mobile: false },
    );

    expect(rowShape()).toEqual({
      columns: "repeat(3, 1fr)",
      labels: ["splitTitle", "txDetail.recurring", "txDetail.dutchPay"],
    });
  });

  it("지출이어도 부모가 onRefund 를 안 주면 3개 — 열도 3이다", () => {
    render(baseExpense, { refundable: false, mobile: false });

    expect(rowShape()).toEqual({
      columns: "repeat(3, 1fr)",
      labels: ["splitTitle", "txDetail.recurring", "txDetail.dutchPay"],
    });
  });

  it("모바일도 같다 — 사용자가 데스크톱·모바일 둘 다 지목했다", () => {
    render(baseExpense, { refundable: true, mobile: true });

    const { columns, labels } = rowShape();
    expect(labels).toHaveLength(4);
    expect(columns).toBe("repeat(4, 1fr)");
  });
});
