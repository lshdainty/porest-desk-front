// 거래 상세의 **환불 마크**와 그 취소.
//
// 환불은 더 이상 수입 행을 만들지 않는다 — 원거래에 "환불됨" 표식을 찍어 합계·잔액에서
// 빼고, 내역·검색에는 남긴다(설계서 2절). 그래서 화면에서 잠글 것이 셋이다.
//
//   1) **확인을 받고, 날짜를 받는다.** 카드사 환급은 며칠 걸리므로 "언제 환불됐나" 는
//      사용자만 안다. 자정이 아니라 **정오**로 보낸다 — 자정으로 보내면 같은 날 앞에
//      찍힌 거래보다 과거가 되어 카드 회차 판정이 하루 밀린다.
//   2) **응답으로 다시 그린다.** 부모는 목록에서 집은 스냅샷을 넘긴다 — 무효화가 끝나도
//      그 객체는 안 바뀌므로, 갈아 주지 않으면 배너가 안 뜨고 두 번 누르게 된다.
//   3) **환불된 거래는 고칠 수 없다.** 돈이 이미 자산으로 돌아가 있어 되돌릴 기준이
//      사라진다(서버도 EXP_043 으로 막는다). 수정·분할을 감추고 환불 취소만 남긴다.
//
// 본문 모양은 `features/expense/api/expenseApi.test.ts` 가, 빠른 동작 줄의 열 수는
// `TxDetailDialog.quickActions.test.tsx` 가 본다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Expense, RefundPreview } from "@/entities/expense";
import { todayLocalKey } from "@/shared/lib/date";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const api = vi.hoisted(() => ({
  refundCalls: [] as { id: number; refundedAt?: string }[],
  cancelCalls: [] as number[],
  /** 서버가 돌려주는 거래 — null 이면 응답이 안 온 것으로 본다. */
  refundReply: null as Expense | null,
  cancelReply: null as Expense | null,
  /** 거래가 달린 자산 — 카드면 확인창이 한 줄 더 말한다. */
  assets: [] as unknown[],
  /** 환불·삭제 확인창의 미리보기 — 없으면 못 받은 것(실패)으로 본다. */
  preview: undefined as RefundPreview | undefined,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "ko" } }),
  // 금액을 가리는 문장(`<amt>`)은 Trans 로 그린다 — 키만 남겨 무엇을 골랐는지 본다.
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("@/features/expense", () => ({
  useExpenseCategories: () => ({ data: [], isLoading: false }),
  useSearchExpenses: () => ({ data: [], isLoading: false }),
  useDeleteExpense: () => ({ mutate: () => {}, isPending: false }),
  // 환불·삭제 확인창의 환급 미리보기 — 테스트가 `api.preview` 로 정한다.
  useRefundPreview: () => ({
    data: api.preview,
    isPending: false,
    isError: api.preview == null,
  }),
  useRefundExpense: () => ({
    mutate: (
      vars: { id: number; refundedAt?: string },
      opts?: { onSuccess?: (e: Expense) => void },
    ) => {
      api.refundCalls.push(vars);
      if (api.refundReply) opts?.onSuccess?.(api.refundReply);
    },
    isPending: false,
  }),
  useCancelRefund: () => ({
    mutate: (id: number, opts?: { onSuccess?: (e: Expense) => void }) => {
      api.cancelCalls.push(id);
      if (api.cancelReply) opts?.onSuccess?.(api.cancelReply);
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
  useAssets: () => ({ data: { assets: api.assets }, isLoading: false }),
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
  assetRowId: 9,
  assetName: "현대카드",
  expenseType: "EXPENSE",
  amount: 3000,
  description: null,
  merchant: "김밥천국",
  expenseDate: "2026-09-05T12:30:00",
  paymentMethod: null,
  installmentMonths: null,
  refundedAt: null,
  refundTransferRowId: null,
  originalAmount: null,
  originalCurrency: null,
  exchangeRate: null,
  calendarEventRowId: null,
  todoRowId: null,
  autoSource: null,
  createAt: "2026-09-05T12:30:00",
  modifyAt: "2026-09-05T12:30:00",
};

const refunded: Expense = {
  ...baseExpense,
  refundedAt: "2026-09-18T12:00:00",
  refundTransferRowId: 41,
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  api.refundCalls = [];
  api.cancelCalls = [];
  api.refundReply = null;
  api.cancelReply = null;
  api.assets = [];
  api.preview = undefined;
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

function render(expense: Expense, opts: { onEdit?: boolean } = {}) {
  act(() =>
    root.render(
      <TxDetailDialog
        expense={expense}
        mobile={false}
        onClose={() => {}}
        onEdit={opts.onEdit === false ? undefined : () => {}}
      />,
    ),
  );
}

/** 라벨 키가 그대로 글자로 나온다(`t` 목) — 버튼을 그 키로 찾는다. */
const buttonsWith = (text: string) =>
  [...document.body.querySelectorAll("button")].filter(
    (b) => b.textContent?.trim() === text,
  );

const refundAction = () => buttonsWith("txDetail.refund")[0] ?? null;
const splitAction = () => buttonsWith("splitTitle")[0] ?? null;
const editButton = () => buttonsWith("edit")[0] ?? null;
/** 환불됨 배너 — `refundedAt` 문구를 담은 span 이다. */
const banner = () =>
  [...document.body.querySelectorAll("span")].find(
    (el) => el.textContent?.trim() === "txDetail.refundedAt",
  ) ?? null;
/** 배너 안의 취소 버튼과 확인창의 확인 버튼이 같은 글자다 — 나중에 붙은 쪽이 확인창. */
const cancelRefundButtons = () => buttonsWith("txDetail.refundCancel");

const click = (el: Element) =>
  act(() => el.dispatchEvent(new MouseEvent("click", { bubbles: true })));

const creditCard = (over: Record<string, unknown> = {}) => ({
  rowId: 9,
  assetName: "현대카드",
  assetType: "CREDIT_CARD",
  paymentAssetRowId: 1,
  ...over,
});

describe("환불은 확인창을 거쳐 표식을 찍는다", () => {
  it("확인창에서 취소하면 아무것도 안 나간다", () => {
    render(baseExpense);
    click(refundAction()!);
    // 확인 전에는 요청이 없다.
    expect(api.refundCalls).toEqual([]);

    click(buttonsWith("cancel")[0]!);

    expect(api.refundCalls).toEqual([]);
    expect(banner()).toBeNull();
  });

  it("확인하면 오늘 날짜 정오로 마크하고, 응답으로 다시 그려 배너가 뜬다", () => {
    api.refundReply = refunded;
    render(baseExpense);
    click(refundAction()!);
    click(buttonsWith("txDetail.refundConfirm")[0]!);

    // 자정이 아니라 정오다 — 같은 날 거래보다 과거가 되면 회차 판정이 밀린다.
    expect(api.refundCalls).toEqual([
      { id: 77, refundedAt: `${todayLocalKey()}T12:00:00` },
    ]);
    // 부모가 넘긴 스냅샷은 그대로인데도 배너가 떠야 한다.
    expect(banner()).not.toBeNull();
    expect(refundAction()).toBeNull();
  });

  it("고른 날짜를 그대로 보낸다 — 환급일은 사용자만 안다", () => {
    api.refundReply = refunded;
    render(baseExpense);
    click(refundAction()!);

    const date = document.getElementById(
      "tx-refund-date",
    ) as HTMLInputElement | null;
    expect(date, "확인창에 환불일 칸이 없다").not.toBeNull();
    // `el.value = ...` 로 직접 넣으면 React 의 값 추적기가 "이미 그 값" 으로 보고
    // onChange 를 건너뛴다. 프로토타입의 setter 로 넣어 추적기를 지나가게 한다.
    act(() => {
      Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )!.set!.call(date!, "2026-09-11");
      date!.dispatchEvent(new Event("input", { bubbles: true }));
    });
    click(buttonsWith("txDetail.refundConfirm")[0]!);

    expect(api.refundCalls).toEqual([
      { id: 77, refundedAt: "2026-09-11T12:00:00" },
    ]);
  });

  it("응답이 안 오면 마크된 척하지 않는다", () => {
    api.refundReply = null;
    render(baseExpense);
    click(refundAction()!);
    click(buttonsWith("txDetail.refundConfirm")[0]!);

    expect(api.refundCalls).toHaveLength(1);
    expect(banner()).toBeNull();
  });
});

describe("카드 거래는 확인창이 한 줄 더 말한다", () => {
  const bodyText = () =>
    document.body.textContent?.replace(/\s+/g, " ").trim() ?? "";

  it("결제계좌가 있으면 미리보기 금액으로 환급을 알린다", () => {
    api.assets = [creditCard()];
    api.preview = { applies: true, refundAmount: 3000, reason: "OK" };
    render(baseExpense);
    click(refundAction()!);

    expect(bodyText()).toContain("txDetail.paidDeleteNote");
  });

  it("결제한 달이 지났으면 기록만 정리된다고 말한다(R6)", () => {
    api.assets = [creditCard()];
    api.preview = {
      applies: false,
      refundAmount: 0,
      reason: "REFUND_WINDOW_CLOSED",
    };
    render(baseExpense);
    click(refundAction()!);

    expect(bodyText()).toContain("txDetail.windowClosedNote");
    expect(bodyText()).not.toContain("txDetail.paidDeleteNote");
  });

  it("미리보기를 못 받으면 금액 없는 안내로 넘어간다", () => {
    api.assets = [creditCard()];
    render(baseExpense);
    click(refundAction()!);

    expect(bodyText()).toContain("txDetail.paidDeleteFallback");
  });

  it("결제계좌가 없으면 잔액만 정리한다고 말한다", () => {
    api.assets = [creditCard({ paymentAssetRowId: null })];
    render(baseExpense);
    click(refundAction()!);

    expect(bodyText()).toContain("txDetail.refundConfirmBodyCardNoAccount");
  });

  it("계좌 거래에는 카드 줄이 없다 — 환급할 카드가 없다", () => {
    api.assets = [
      creditCard({ assetType: "BANK_ACCOUNT", paymentAssetRowId: null }),
    ];
    render(baseExpense);
    click(refundAction()!);

    expect(bodyText()).not.toContain("txDetail.refundConfirmBodyCard");
    expect(bodyText()).not.toContain("txDetail.paidDeleteFallback");
  });
});

describe("기록만 남긴 거래는 상세에서 한 번 더 말한다(닫힌 회차 R2)", () => {
  const note = () =>
    document.body.querySelector("[data-testid='record-only-note']");

  it("일시불 — 계좌에서 안 빠졌다는 문장", () => {
    render({ ...baseExpense, cardSettledThrough: "2026-08-31" });

    expect(note()?.textContent).toBe("txDetail.recordOnlyNote");
  });

  it("할부 — 지난 회차분만 기록용이면 '이 중' 문장", () => {
    render({
      ...baseExpense,
      amount: 90000,
      installmentMonths: 3,
      cardSettledThrough: "2026-08-31",
      recordOnlyAmount: 60000,
    });

    expect(note()?.textContent).toBe("txDetail.recordOnlyPartNote");
  });

  it("정상 거래·환불된 거래에는 없다", () => {
    render(baseExpense);
    expect(note()).toBeNull();
  });
});

describe("환불된 거래는 되돌리기만 열려 있다", () => {
  it("배너·취소만 있고 수정·분할·환불은 없다", () => {
    render(refunded);

    expect(banner()).not.toBeNull();
    expect(cancelRefundButtons()).toHaveLength(1);
    // 서버가 EXP_043 으로 막는 자리 둘 — 눌러 봐야 토스트만 뜬다.
    expect(editButton()).toBeNull();
    expect(splitAction()).toBeNull();
    expect(refundAction()).toBeNull();
  });

  it("취소도 확인을 받고, 응답으로 배너를 걷는다", () => {
    api.cancelReply = baseExpense;
    render(refunded);
    click(cancelRefundButtons()[0]!);
    expect(api.cancelCalls).toEqual([]);

    // 확인창의 확인 버튼도 같은 글자다 — 나중에 붙은 쪽을 누른다.
    const buttons = cancelRefundButtons();
    expect(buttons.length).toBe(2);
    click(buttons[buttons.length - 1]!);

    expect(api.cancelCalls).toEqual([77]);
    expect(banner()).toBeNull();
    expect(refundAction()).not.toBeNull();
  });

  it("확인창에서 취소하면 아무것도 안 나간다", () => {
    render(refunded);
    click(cancelRefundButtons()[0]!);
    click(buttonsWith("cancel")[0]!);

    expect(api.cancelCalls).toEqual([]);
    expect(banner()).not.toBeNull();
  });

  // 금액이 틀렸으면 환불을 취소하고 고치는 길이 있지만, 그 거래 자체가 잘못 들어온
  // 경우엔 삭제가 유일한 출구다. 막으면 막다른 길이 된다.
  it("삭제는 남아 있다", () => {
    render(refunded);

    const del = buttonsWith("delete")[0];
    expect(del).toBeDefined();
    expect(del!.disabled).toBe(false);
  });
});
