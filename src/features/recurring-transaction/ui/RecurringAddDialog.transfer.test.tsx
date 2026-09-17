// 이체 반복이 **보내는 것**을 고정한다.
//
// 이 본문은 밤마다 서버가 그대로 실행한다 — 잘못 저장되면 화면엔 "저장됐다" 가 남고
// 자정 배치만 조용히 실패한다(로그만 남는다). 그래서 세 가지를 못 박는다.
//
// - 이체면 받는 계좌·수수료·이자가 실린다.
// - 이체에는 카테고리·거래처·결제수단이 없다 — 서버가 실려 오면 400 으로 거절한다.
// - 종류를 지출로 되돌리면 이체 칸이 빠진다 — 남겨 두면 같은 이유로 거절당한다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Asset } from "@/entities/asset";
import type { ExpenseCategory } from "@/entities/expense";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const sent = vi.hoisted(() => ({
  create: null as Record<string, unknown> | null,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("@/features/expense", () => ({
  useExpenseCategories: () => ({ data: [category], isLoading: false }),
}));
vi.mock("@/features/asset", () => ({
  useAssets: () => ({
    data: { assets: [bank, savings, card] },
    isLoading: false,
  }),
}));
vi.mock("@/features/recurring-transaction", () => ({
  useCreateRecurringTransaction: () => ({
    mutate: (data: Record<string, unknown>) => {
      sent.create = data;
    },
    isPending: false,
  }),
  useUpdateRecurringTransaction: () => ({
    mutate: () => {},
    isPending: false,
  }),
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

const bank: Asset = {
  rowId: 3,
  userRowId: 1,
  assetName: "주거래",
  assetType: "BANK_ACCOUNT",
  balance: 0,
  cashBalance: 0,
  holdingBalance: 0,
  currency: "KRW",
  exchangeRate: 1,
  color: null,
  institution: "국민",
  memo: null,
  sortOrder: 0,
  isIncludedInTotal: "Y",
  isAmountHidden: "N",
  cardCatalog: null,
  createAt: "2026-01-01T00:00:00",
  modifyAt: "2026-01-01T00:00:00",
};
const savings: Asset = {
  ...bank,
  rowId: 4,
  assetName: "청약",
  assetType: "SAVINGS",
};
const card: Asset = {
  ...bank,
  rowId: 5,
  assetName: "체크",
  assetType: "CHECK_CARD",
};

const { RecurringAddDialog } = await import("./RecurringAddDialog");

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  sent.create = null;
  const proto = window.HTMLElement.prototype as unknown as Record<
    string,
    unknown
  >;
  proto.hasPointerCapture = () => false;
  proto.setPointerCapture = () => {};
  proto.releasePointerCapture = () => {};
  proto.scrollIntoView = () => {};
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(<RecurringAddDialog mobile={false} onClose={() => {}} />),
  );
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const byText = <T extends Element>(selector: string, text: string) =>
  [...document.body.querySelectorAll<T>(selector)].find(
    (el) => el.textContent?.trim() === text,
  );

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

/** radix Tabs 는 `mousedown` 에서 바꾼다 — `click` 만 쏘면 아무 일도 안 일어난다. */
function switchTab(label: string) {
  const tab = byText<HTMLButtonElement>("button", label);
  if (!tab) throw new Error(`탭을 찾지 못했다: ${label}`);
  act(() => tab.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })));
}

/** Radix Select 를 키보드로 연다 — 포인터는 jsdom 에서 안 뜬다. */
function openSelect(triggerText: string) {
  const trigger = byText<HTMLButtonElement>("button", triggerText);
  if (!trigger) throw new Error(`셀렉트를 찾지 못했다: ${triggerText}`);
  act(() => {
    trigger.focus();
    trigger.dispatchEvent(
      new KeyboardEvent("keydown", { key: " ", bubbles: true }),
    );
  });
}

function pickOption(triggerText: string, optionText: string) {
  openSelect(triggerText);
  const option = byText("[role='option']", optionText);
  if (!option) throw new Error(`항목을 찾지 못했다: ${optionText}`);
  act(() =>
    option.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    ),
  );
}

const amountBox = () =>
  [...document.body.querySelectorAll<HTMLInputElement>("input")].find(
    (el) => el.placeholder === "0",
  )!;

function save() {
  const btn = byText<HTMLButtonElement>("button", "add");
  if (!btn) throw new Error("저장 버튼을 찾지 못했다");
  act(() => btn.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

describe("이체 반복", () => {
  it("받는 계좌·수수료가 실리고, 카테고리·거래처는 안 실린다", () => {
    switchTab("addTx.transfer");
    setValue(amountBox(), "300000");
    pickOption("addTx.selectPlaceholder", "국민 · 주거래");
    pickOption("addTx.selectPlaceholder", "국민 · 청약");
    // 금액칸 다음의 "0" 자리가 수수료다.
    const boxes = [
      ...document.body.querySelectorAll<HTMLInputElement>("input"),
    ].filter((el) => el.placeholder === "0");
    setValue(boxes[1]!, "500");
    save();

    expect(sent.create).not.toBeNull();
    expect(sent.create!.expenseType).toBe("TRANSFER");
    expect(sent.create!.assetRowId).toBe(3);
    expect(sent.create!.toAssetRowId).toBe(4);
    expect(sent.create!.fee).toBe(500);
    expect(sent.create!.categoryRowId).toBeUndefined();
    expect(sent.create!.merchant).toBeUndefined();
    expect(sent.create!.paymentMethod).toBeUndefined();
  });

  it("양쪽 계좌가 없으면 저장이 열리지 않는다 — 자정마다 조용히 실패할 규칙이 된다", () => {
    switchTab("addTx.transfer");
    setValue(amountBox(), "300000");
    save();
    expect(sent.create).toBeNull();
  });

  it("카드는 이체 상대 목록에 없다 — 서버도 400 으로 막는다", () => {
    switchTab("addTx.transfer");
    openSelect("addTx.selectPlaceholder");
    const options = [...document.body.querySelectorAll("[role='option']")].map(
      (el) => el.textContent?.trim(),
    );
    expect(options).toContain("국민 · 주거래");
    expect(options).toContain("국민 · 청약");
    expect(options).not.toContain("국민 · 체크");
  });

  it("지출로 되돌리면 이체 칸이 빠진다", () => {
    switchTab("addTx.transfer");
    setValue(amountBox(), "300000");
    pickOption("addTx.selectPlaceholder", "국민 · 주거래");
    pickOption("addTx.selectPlaceholder", "국민 · 청약");
    switchTab("expense");
    save();

    expect(sent.create!.expenseType).toBe("EXPENSE");
    expect(sent.create!.toAssetRowId).toBeUndefined();
    expect(sent.create!.fee).toBeUndefined();
    expect(sent.create!.interestAmount).toBeUndefined();
  });
});
