// 카드 거래 저장 확인 — 결제가 끝난 회차에 드는 카드 거래면 저장 **전에** "이미 결제가 끝난
// 회차예요. 기록만 바뀌고 계좌 잔액은 그대로예요." 를 한 번 묻는다(D1).
//
// 무엇을 말할지는 거래 날짜와 카드의 `cardClosedThrough` 만으로 정한다 — 서버에 미리 묻지
// 않는다(D4). 예전엔 미리보기를 불러 문장을 골랐고, 그 조회가 늦거나 실패하면 묻지 않고
// 저장해 예고 없이 돈이 움직였다(QA 24차 1). 여기서 잠그는 것:
//   (1) 물어야 할 자리(닫힌 회차)에서만 묻고, 열린 회차·카드 아닌 거래는 바로 저장한다
//   (2) 확인해야 저장이 나간다 — 새 거래·문자 저장·편집 저장 모두
//   (3) 할부가 닫힌 회차와 열린 회차에 걸치면 "지난 회차분만" 으로 말한다
//   (4) 저장 응답에 미리 낸 돈의 환급이 실리면 토스트 훅으로 넘긴다(D4)
//   (5) 시트 제목이 빈 채로 그려지지 않는다(a262255 회귀)
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetPointerBlockForTest } from "@/shared/lib/porest/pointer-block";
import type { Expense, ExpenseCategory } from "@/entities/expense";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const st = vi.hoisted(() => ({
  create: null as Record<string, unknown> | null,
  update: null as Record<string, unknown> | null,
  sms: null as Record<string, unknown> | null,
  /** 수정 응답 — 열린 회차에서 미리 낸 돈이 돌아오면 금액이 실린다. */
  updateReply: { refundedAmount: null } as Record<string, unknown>,
  notified: [] as { result: unknown; context: unknown }[],
  /** 문자에서 읽은 거래 날짜 — 회차를 가른다. */
  smsDate: "2026-08-20T10:00:00",
  smsInstallment: null as number | null,
  /** 카드가 결제를 끝낸 마지막 회차의 말일. */
  closedThrough: "2026-08-31" as string | null,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("@/features/expense", () => ({
  useExpenseCategories: () => ({ data: [category], isLoading: false }),
  useExpenseTemplates: () => ({ data: [], isLoading: false }),
  useCreateExpense: () => ({
    mutate: (data: Record<string, unknown>) => {
      st.create = data;
    },
    isPending: false,
  }),
  useUpdateExpense: () => ({
    mutate: (
      { data }: { id: number; data: Record<string, unknown> },
      opts?: { onSuccess?: (r: unknown) => void },
    ) => {
      st.update = data;
      opts?.onSuccess?.(st.updateReply);
    },
    isPending: false,
  }),
  useReplaceExpense: () => ({ mutate: () => {}, isPending: false }),
  useLedgerResultToast:
    () =>
    (result: unknown, context: unknown = {}) =>
      st.notified.push({ result, context }),
  useCreateExpenseTemplate: () => ({ mutate: () => {}, isPending: false }),
  useTouchExpenseTemplate: () => ({ mutate: () => {}, isPending: false }),
}));
vi.mock("@/features/asset", () => ({
  useAssets: () => ({
    data: { assets: [{ ...card, cardClosedThrough: st.closedThrough }, bank] },
    isLoading: false,
  }),
  useCreateTransfer: () => ({ mutate: () => {}, isPending: false }),
  useUpdateTransfer: () => ({ mutate: () => {}, isPending: false }),
}));
vi.mock("@/features/sms", () => ({
  SmsPasteField: ({
    onParsed,
  }: {
    onParsed: (text: string, parsed: Record<string, unknown>) => void;
  }) => (
    <button
      type="button"
      onClick={() =>
        onParsed("[Web발신] 현대카드 5,500원 스타벅스", {
          matched: true,
          confidence: "HIGH",
          cancel: false,
          amount: 5500,
          merchant: "스타벅스",
          expenseDate: st.smsDate,
          installmentMonths: st.smsInstallment,
          cardHint: null,
          issuerName: null,
          cardLast4: null,
          assetRowId: 9,
          assetRemembered: true,
          assetCandidates: [],
          categoryRowId: 11,
          categoryName: "식비",
          originalAmount: null,
          originalCurrency: null,
        })
      }
    >
      sms-parse
    </button>
  ),
  useCommitSms: () => ({
    mutate: (data: Record<string, unknown>) => {
      st.sms = data;
    },
    isPending: false,
  }),
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

/** 결제일 12일 신용카드 — 결제계좌가 있다. 닫힌 회차 경계는 `st.closedThrough`. */
const card = {
  rowId: 9,
  assetName: "현대카드",
  assetType: "CREDIT_CARD",
  paymentDay: 12,
  paymentAssetRowId: 1,
  balance: 0,
  isIncludedInTotal: "Y",
  sortOrder: 0,
};

/** 입출금 계좌 — 회차가 없다. */
const bank = {
  rowId: 3,
  assetName: "주거래",
  assetType: "BANK_ACCOUNT",
  balance: 1_000_000,
  isIncludedInTotal: "Y",
  sortOrder: 1,
};

const cardExpense: Expense = {
  rowId: 501,
  categoryRowId: 11,
  assetRowId: 9,
  assetName: "현대카드",
  expenseType: "EXPENSE",
  amount: 12_000,
  description: null,
  expenseDate: "2026-09-05T12:30:00",
  merchant: "김밥천국",
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
  createAt: "2026-09-05T12:30:00",
  modifyAt: "2026-09-05T12:30:00",
};

const { AddTxSheet } = await import("./AddTxSheet");

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  __resetPointerBlockForTest();
  st.create = null;
  st.update = null;
  st.sms = null;
  st.updateReply = { refundedAmount: null };
  st.notified = [];
  st.smsDate = "2026-08-20T10:00:00";
  st.smsInstallment = null;
  st.closedThrough = "2026-08-31";
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

function render(expense: Expense | null = null) {
  act(() =>
    root.render(
      <AddTxSheet onClose={() => {}} mobile={false} expense={expense} />,
    ),
  );
}

const buttons = (text: string) =>
  [...document.body.querySelectorAll("button")].filter(
    (b) => b.textContent?.trim() === text,
  );

async function click(el: Element) {
  await act(async () => {
    el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 }));
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

/** 시트의 저장 — 새 거래는 `addTx.add`, 편집은 `save`. 확인창의 `save` 는 나중에 붙는다. */
const sheetSave = () => buttons("addTx.add")[0] ?? buttons("save")[0]!;
const dialogSave = () => {
  const all = buttons("save");
  return all[all.length - 1]!;
};
const bodyText = () => document.body.textContent ?? "";

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
const byValue = (v: string) =>
  [...document.body.querySelectorAll<HTMLInputElement>("input")].find(
    (el) => el.value === v,
  );

describe("새 카드 지출", () => {
  it("결제가 끝난 회차면 한 줄을 묻고, 확인해야 저장한다", async () => {
    render();
    await click(buttons("sms-parse")[0]!);
    await click(sheetSave());

    expect(bodyText()).toContain("addTx.saveConfirmTitle");
    expect(bodyText()).toContain("closedCycle.note");
    expect(st.sms).toBeNull();

    await click(dialogSave());

    expect(st.sms).not.toBeNull();
    expect(st.sms!.assetRowId).toBe(9);
  });

  it("결제일 당일 회차도 닫힌 회차다 — 경계 날짜(말일)도 묻는다(D2)", async () => {
    st.smsDate = "2026-08-31T23:00:00";
    render();
    await click(buttons("sms-parse")[0]!);
    await click(sheetSave());

    expect(bodyText()).toContain("closedCycle.note");
    expect(st.sms).toBeNull();
  });

  it("할부가 닫힌 회차와 열린 회차에 걸치면 '지난 회차분만'", async () => {
    // 8/20 시작 3개월 = 8·9·10월 회차. 8월까지 닫혔다.
    st.smsInstallment = 3;
    render();
    await click(buttons("sms-parse")[0]!);
    await click(sheetSave());

    expect(bodyText()).toContain("closedCycle.partialNote");
    expect(bodyText()).not.toContain("closedCycle.note");
  });

  it("열린 회차는 묻지 않고 바로 저장한다", async () => {
    st.smsDate = "2026-09-10T10:00:00";
    render();
    await click(buttons("sms-parse")[0]!);
    await click(sheetSave());

    expect(bodyText()).not.toContain("closedCycle.");
    expect(st.sms).not.toBeNull();
  });

  it("닫힌 회차가 없는 카드(결제일 없음·새 카드)는 묻지 않는다", async () => {
    st.closedThrough = null;
    render();
    await click(buttons("sms-parse")[0]!);
    await click(sheetSave());

    expect(st.sms).not.toBeNull();
  });
});

describe("카드 거래 수정", () => {
  it("결제가 끝난 회차의 거래면 저장 전에 같은 한 줄을 묻는다", async () => {
    st.closedThrough = "2026-09-30";
    render(cardExpense);
    await click(sheetSave());

    expect(bodyText()).toContain("closedCycle.note");
    expect(st.update).toBeNull();

    await click(dialogSave());

    expect(st.update).not.toBeNull();
  });

  it("열린 회차의 거래는 묻지 않고 저장한다", async () => {
    render(cardExpense);
    await click(sheetSave());

    expect(bodyText()).not.toContain("closedCycle.");
    expect(st.update).not.toBeNull();
  });

  it("열린 회차 거래를 닫힌 회차 날짜로 옮기면 묻는다 — 저장하면 기록만 남는다", async () => {
    render(cardExpense);
    setValue(byValue("2026-09-05")!, "2026-08-20");
    await click(sheetSave());

    expect(bodyText()).toContain("closedCycle.note");
    expect(st.update).toBeNull();
  });

  it("미리 낸 돈이 돌아왔으면 응답을 토스트 훅으로 넘긴다(D4) — 닫힌 회차 버튼은 없다", async () => {
    st.updateReply = { rowId: 501, refundedAmount: 7000 };
    render(cardExpense);
    await click(sheetSave());

    expect(st.notified).toEqual([
      { result: { rowId: 501, refundedAmount: 7000 }, context: {} },
    ]);
  });
});

describe("시트 제목", () => {
  // 한때 식이 빠져 값 없는 `title` prop 만 남았다 — 제목 자리가 비어 그려졌다(a262255).
  it("새 거래는 '거래 추가', 수정은 '거래 수정' 이다", () => {
    render();
    expect(bodyText()).toContain("addTx.newTitle");

    act(() => root.unmount());
    root = createRoot(container);
    render(cardExpense);
    expect(bodyText()).toContain("addTx.editTitle");
  });
});
