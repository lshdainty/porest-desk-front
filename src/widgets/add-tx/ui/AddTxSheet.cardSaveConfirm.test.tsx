// 카드 거래 저장 확인 — 결제가 끝난 회차면 "기록만 남아요", 결제일 당일이면 "추가로 빠져요",
// 결제한 달이 지난 수정이면 "기록만 정리돼요" 를 **저장 전에** 묻는다(닫힌 회차 R2·R3·R6).
//
// 무엇을 말할지는 서버 미리보기가 정한다 — 여기서는 (1) 물어야 할 자리에서만 묻는지,
// (2) 답을 어떤 문장으로 옮기는지, (3) 확인해야 저장이 나가는지를 잠근다. 결제일 전 회차에
// 요청을 보내면 평범한 저장마다 왕복이 하나 붙는다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetPointerBlockForTest } from "@/shared/lib/porest/pointer-block";
import type {
  Expense,
  ExpenseCategory,
  RefundPreview,
} from "@/entities/expense";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const st = vi.hoisted(() => ({
  update: null as Record<string, unknown> | null,
  sms: null as Record<string, unknown> | null,
  savePreviewCalls: 0,
  savePreview: null as RefundPreview | null,
  editPreview: null as RefundPreview | null,
  /** 문자에서 읽은 거래 날짜 — 회차를 가른다. */
  smsDate: "2026-08-20T10:00:00",
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("@/features/expense", () => ({
  expenseApi: {
    refundPreview: () => Promise.resolve(st.editPreview),
    cardSavePreview: () => {
      st.savePreviewCalls += 1;
      return Promise.resolve(st.savePreview);
    },
  },
  useExpenseCategories: () => ({ data: [category], isLoading: false }),
  useExpenseTemplates: () => ({ data: [], isLoading: false }),
  useCreateExpense: () => ({ mutate: () => {}, isPending: false }),
  useUpdateExpense: () => ({
    mutate: ({ data }: { id: number; data: Record<string, unknown> }) => {
      st.update = data;
    },
    isPending: false,
  }),
  useCreateExpenseTemplate: () => ({ mutate: () => {}, isPending: false }),
  useTouchExpenseTemplate: () => ({ mutate: () => {}, isPending: false }),
}));
vi.mock("@/features/asset", () => ({
  useAssets: () => ({ data: { assets: [card] }, isLoading: false }),
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
          installmentMonths: null,
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

/** 결제일 12일 신용카드 — 결제계좌가 있다. */
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

const cardExpense: Expense = {
  rowId: 501,
  categoryRowId: 11,
  assetRowId: 9,
  assetName: "현대카드",
  expenseType: "EXPENSE",
  amount: 12_000,
  description: null,
  expenseDate: "2026-08-05T12:30:00",
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
  createAt: "2026-08-05T12:30:00",
  modifyAt: "2026-08-05T12:30:00",
};

const { AddTxSheet } = await import("./AddTxSheet");

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  __resetPointerBlockForTest();
  st.update = null;
  st.sms = null;
  st.savePreviewCalls = 0;
  st.savePreview = null;
  st.editPreview = null;
  st.smsDate = "2026-08-20T10:00:00";
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

const preview = (over: Partial<RefundPreview>): RefundPreview => ({
  applies: false,
  refundAmount: 0,
  reason: "NOT_PAID_CYCLE",
  newRecordAmount: 0,
  sameDayExtraPayment: 0,
  ...over,
});

describe("새 카드 지출", () => {
  it("결제가 끝난 회차면 '기록만 남아요' 를 묻고, 확인해야 저장한다", async () => {
    st.savePreview = preview({ newRecordAmount: 5500 });
    render();
    await click(buttons("sms-parse")[0]!);
    await click(sheetSave());

    expect(st.savePreviewCalls).toBe(1);
    expect(bodyText()).toContain("addTx.closedCycleNote");
    expect(st.sms).toBeNull();

    await click(dialogSave());

    expect(st.sms).not.toBeNull();
    expect(st.sms!.assetRowId).toBe(9);
  });

  it("결제일 당일이면 추가로 빠지는 금액을 말한다", async () => {
    st.savePreview = preview({ sameDayExtraPayment: 5500 });
    render();
    await click(buttons("sms-parse")[0]!);
    await click(sheetSave());

    expect(bodyText()).toContain("addTx.sameDayPaymentNote");
    expect(bodyText()).not.toContain("addTx.closedCycleNote");
  });

  it("결제일 전 회차는 묻지도 않고 바로 저장한다", async () => {
    st.smsDate = "2099-01-10T10:00:00";
    render();
    await click(buttons("sms-parse")[0]!);
    await click(sheetSave());

    expect(st.savePreviewCalls).toBe(0);
    expect(st.sms).not.toBeNull();
  });

  it("서버가 할 말이 없다고 하면 묻지 않고 저장한다", async () => {
    st.savePreview = preview({});
    render();
    await click(buttons("sms-parse")[0]!);
    await click(sheetSave());

    expect(st.savePreviewCalls).toBe(1);
    expect(st.sms).not.toBeNull();
  });
});

describe("카드 거래 수정", () => {
  it("결제한 달이 지났으면 '기록만 정리돼요' 를 묻는다(R6)", async () => {
    st.editPreview = preview({ reason: "REFUND_WINDOW_CLOSED" });
    render(cardExpense);
    await click(sheetSave());

    expect(bodyText()).toContain("txDetail.windowClosedNote");
    expect(st.update).toBeNull();

    await click(dialogSave());

    expect(st.update).not.toBeNull();
  });

  it("환급만 있으면 종전 감액 문구 그대로다", async () => {
    st.editPreview = preview({
      applies: true,
      refundAmount: 2000,
      reason: "OK",
    });
    render(cardExpense);
    await click(sheetSave());

    expect(bodyText()).toContain("addTx.paidReduceNote");
    expect(bodyText()).not.toContain("txDetail.paidDeleteNote");
  });
});
