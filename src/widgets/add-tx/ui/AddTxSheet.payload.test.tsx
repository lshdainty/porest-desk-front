// 거래 시트가 **보내는 것**을 고정한다 (QA #107 · #108).
//
// 규칙은 하나다 — 이 시트가 **가진 칸만** 싣는다.
// PUT 은 세 갈래이므로(`Patch`: 키 없음=유지 · null=지움 · 값=교체, QA #96)
// 칸이 있으면 지금 상태를 그대로(비었으면 `null`) 싣고, 칸이 없으면 키를 뺀다.
//
// - 거래처·설명·결제수단·계좌: 시트가 그리는 칸이다. 비운 채 저장하면 지워져야 하는데
//   `|| undefined` 로 키를 빼서 화면만 지워진 척 닫히고 옛 값이 서버에 남았다(#107).
// - 환불 연결: 연결을 **끊는 칸이 없다.** 그런데 편집에서도 늘 명시 null 이 나가,
//   메모만 고쳐 저장해도 원거래의 환불 수·환불액이 0 이 되고 상계가 사라졌다(#108).
//   같은 파일에서 앞의 넷은 "키를 넣어라", 이건 "키를 빼라" 다 — 둘 다 같은 규칙이다.
//
// 반대편도 잠근다 — 값이 있는 칸은 그대로 나가야 하고, 환불을 **새로 만들 때는**
// 연결이 실려야 한다. 안 그러면 "전부 null" · "환불 연결 폐지" 같은 수정이 통과한다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetPointerBlockForTest } from "@/shared/lib/porest/pointer-block";
import type { Expense, ExpenseCategory } from "@/entities/expense";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const sent = vi.hoisted(() => ({
  update: null as Record<string, unknown> | null,
  create: null as Record<string, unknown> | null,
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

/** 환불은 수입으로 들어간다 — 수입 카테고리가 없으면 시트가 분류를 비워 저장이 안 열린다. */
const incomeCategory: ExpenseCategory = {
  ...category,
  rowId: 21,
  categoryName: "환불",
  expenseType: "INCOME",
};

const state = { categories: [category, incomeCategory] as ExpenseCategory[] };

const baseExpense: Expense = {
  rowId: 501,
  categoryRowId: 11,
  assetRowId: 3,
  assetName: "주거래",
  expenseType: "EXPENSE",
  amount: 12_000,
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
  // 모달이 닫히면 그 뒤 POINTER_BLOCK_MS 동안 클릭이 삼켜진다(오클릭 방어) — 케이스끼리 옮지 않게 푼다.
  __resetPointerBlockForTest();
  sent.update = null;
  sent.create = null;
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

/** 리액트가 관리하는 입력에 값을 넣는다(setter 를 우회하면 상태가 안 바뀐다). */
function setValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
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

const byValue = (v: string) =>
  [
    ...document.body.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      "input, textarea",
    ),
  ].find((el) => el.value === v);

function render(props: {
  expense?: Expense | null;
  refundOf?: Expense | null;
}) {
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

function clickSave() {
  const save = [...document.body.querySelectorAll("button")].find((b) =>
    ["save", "addTx.add"].includes(b.textContent?.trim() ?? ""),
  );
  if (!save) throw new Error("저장 버튼을 찾지 못했다");
  act(() => save.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

describe("비운 칸은 명시 null 로 나간다 (QA #107)", () => {
  it("거래처·설명을 지우면 null 이 나간다 — 값이 있는 칸은 그대로", () => {
    render({ expense: baseExpense });
    setValue(byValue("김밥천국")!, "");
    setValue(byValue("점심")!, "");
    clickSave();

    expect(sent.update).not.toBeNull();
    expect(sent.update!.merchant).toBeNull();
    expect(sent.update!.description).toBeNull();
    // 반대편 — 안 건드린 칸은 값을 지킨다.
    expect(sent.update!.paymentMethod).toBe("CARD");
    expect(sent.update!.assetRowId).toBe(3);
  });

  it("결제수단·계좌가 비어 있으면 키가 아니라 null 로 나간다", () => {
    render({
      expense: { ...baseExpense, paymentMethod: null, assetRowId: null },
    });
    clickSave();

    // `undefined` 였다면 키 자체가 없어 서버가 "안 고침" 으로 읽는다.
    expect(sent.update!).toHaveProperty("paymentMethod");
    expect(sent.update!).toHaveProperty("assetRowId");
    expect(sent.update!.paymentMethod).toBeNull();
    expect(sent.update!.assetRowId).toBeNull();
    // 반대편 — 채워진 칸은 그대로.
    expect(sent.update!.merchant).toBe("김밥천국");
    expect(sent.update!.description).toBe("점심");
  });
});

describe("환불 연결 (QA #108)", () => {
  it("편집에서는 키를 아예 안 싣는다 — 서버가 지금 연결을 지킨다", () => {
    render({
      expense: {
        ...baseExpense,
        expenseType: "INCOME",
        categoryRowId: 21,
        // 이 수입은 원거래에 묶인 환불이다 — 그 연결이 통계 상계를 만든다.
        refundOfExpenseRowId: 500,
      },
    });
    setValue(byValue("점심")!, "메모만 고친다");
    clickSave();

    expect(sent.update!).not.toHaveProperty("refundOfExpenseRowId");
  });

  it("환불을 새로 기록할 때는 원거래를 싣는다", () => {
    render({ refundOf: { ...baseExpense, categoryRowId: 21 } });
    clickSave();

    expect(sent.create).not.toBeNull();
    expect(sent.create!.refundOfExpenseRowId).toBe(501);
  });
});
