// 거래 상세의 **환불 취소** (D3 · 앱 desk-app #331 의 미러).
//
// 환불로 잘못 묶은 거래를 푸는 방법이 **삭제뿐**이었다. 편집 시트에는 환불 연결 칸이
// 없고, 그래서 저장 본문은 그 키를 아예 안 싣는다 — 실었다가는 메모만 고쳐도 연결이
// 끊겨 원거래의 지출 상계가 사라진다(QA #108). 결과적으로 "끊어라" 를 보낼 자리가
// 어디에도 없었다. 이 버튼이 그 자리다.
//
// 여기서 잠그는 것 셋:
//   1) **판정은 `isRefundTx`** — 수입 + 원거래 연결. 연결만 보면 지출에 남은 연결에도
//      뜨고, 수입만 보면 모든 수입에 뜬다.
//   2) **확인을 받는다.** 되돌리는 칸이 어느 화면에도 없어서(다시 묶으려면 이 거래를
//      지우고 원거래에서 환불을 새로 기록해야 한다) 삭제와 같은 무게로 묻는다.
//   3) **응답으로 다시 그린다.** 부모는 목록에서 집은 스냅샷을 넘긴다 — 무효화가 끝나도
//      그 객체는 안 바뀌므로, 갈아 주지 않으면 배너가 남아 두 번 누르게 된다.
//
// 본문이 무엇인지는 `features/expense/api/expenseApi.test.ts` 가 본다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Expense } from "@/entities/expense";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const unlink = vi.hoisted(() => ({
  calls: [] as number[],
  /** 서버가 돌려주는 거래 — 연결이 끊긴 모습이다. */
  reply: null as Expense | null,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "ko" } }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("@/features/expense", () => ({
  useExpenseCategories: () => ({ data: [], isLoading: false }),
  useSearchExpenses: () => ({ data: [], isLoading: false }),
  useDeleteExpense: () => ({ mutate: () => {}, isPending: false }),
  useUnlinkRefund: () => ({
    mutate: (id: number, opts?: { onSuccess?: (e: Expense) => void }) => {
      unlink.calls.push(id);
      if (unlink.reply) opts?.onSuccess?.(unlink.reply);
    },
    isPending: false,
  }),
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
  expenseType: "INCOME",
  amount: 3000,
  description: null,
  merchant: "김밥천국",
  expenseDate: "2026-09-05T12:30:00",
  paymentMethod: null,
  installmentMonths: null,
  refundOfExpenseRowId: 500,
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
  unlink.calls = [];
  unlink.reply = null;
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

function render(expense: Expense) {
  act(() =>
    root.render(
      <TxDetailDialog expense={expense} mobile={false} onClose={() => {}} />,
    ),
  );
}

/** 라벨 키가 그대로 글자로 나온다(`t` 목) — 버튼을 그 키로 찾는다. */
const buttonsWith = (text: string) =>
  [...document.body.querySelectorAll("button")].filter(
    (b) => b.textContent?.trim() === text,
  );

const unlinkButton = () => buttonsWith("txDetail.refundUnlink")[0] ?? null;
const banner = () =>
  [...document.body.querySelectorAll("span")].find(
    (el) => el.textContent?.trim() === "txDetail.refundOfLinked",
  ) ?? null;

const click = (el: Element) =>
  act(() => el.dispatchEvent(new MouseEvent("click", { bubbles: true })));

describe("버튼이 보이는 조건은 isRefundTx 다", () => {
  it("환불 거래(수입 + 원거래 연결)에는 보인다", () => {
    render(baseExpense);

    expect(banner()).not.toBeNull();
    expect(unlinkButton()).not.toBeNull();
  });

  it("지출에 연결이 남아 있어도 안 보인다 — 연결만 보고 가르면 여기서 샌다", () => {
    render({ ...baseExpense, expenseType: "EXPENSE" });

    expect(banner()).toBeNull();
    expect(unlinkButton()).toBeNull();
  });

  it("그냥 수입에는 안 보인다 — 수입만 보고 가르면 여기서 샌다", () => {
    render({ ...baseExpense, refundOfExpenseRowId: null });

    expect(banner()).toBeNull();
    expect(unlinkButton()).toBeNull();
  });
});

describe("누르면 확인을 받는다", () => {
  it("확인창에서 취소하면 아무것도 안 나간다", () => {
    render(baseExpense);
    click(unlinkButton()!);
    // 확인 전에는 요청이 없다.
    expect(unlink.calls).toEqual([]);

    click(buttonsWith("cancel")[0]!);

    expect(unlink.calls).toEqual([]);
    // 배너는 그대로 남는다 — 아무 일도 안 일어났다.
    expect(banner()).not.toBeNull();
  });

  it("확인하면 이 거래 하나만 끊고, 응답으로 다시 그려 배너가 사라진다", () => {
    unlink.reply = { ...baseExpense, refundOfExpenseRowId: null };
    render(baseExpense);
    click(unlinkButton()!);

    // 확인창의 확인 버튼도 같은 글자다(제목·버튼 모두 '환불 취소') —
    // 배너의 것 말고 나중에 붙은 쪽을 누른다.
    const confirms = buttonsWith("txDetail.refundUnlink");
    expect(confirms.length).toBe(2);
    click(confirms[confirms.length - 1]!);

    expect(unlink.calls).toEqual([77]);
    // 부모가 넘긴 스냅샷은 그대로인데도 배너가 사라져야 한다.
    expect(banner()).toBeNull();
    expect(unlinkButton()).toBeNull();
  });

  it("응답이 안 오면 배너를 지우지 않는다 — 끊긴 척하지 않는다", () => {
    unlink.reply = null;
    render(baseExpense);
    click(unlinkButton()!);
    const confirms = buttonsWith("txDetail.refundUnlink");
    click(confirms[confirms.length - 1]!);

    expect(unlink.calls).toEqual([77]);
    expect(banner()).not.toBeNull();
  });
});

// 환불 행의 **금액**은 편집 시트에서 잠겼다(`AddTxSheet.refundEditLock.test.tsx`) —
// "금액이 틀렸으면 지우고 다시 넣는다" 가 사용자가 쓸 길이라, 삭제가 여기 남아 있어야
// 그 길이 뚫려 있다. 삭제까지 막으면 잘못 적은 환불이 영구히 남는 막다른 길이 된다.
describe("환불 행도 삭제는 열려 있다", () => {
  it("환불 거래에 삭제 버튼이 남아 있다", () => {
    render(baseExpense);

    const del = buttonsWith("delete")[0];
    expect(del).toBeDefined();
    expect(del!.disabled).toBe(false);
  });
});
