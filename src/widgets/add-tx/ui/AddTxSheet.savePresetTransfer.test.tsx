// 시트의 "현재 입력값 저장" 대화상자 — 이체 시드일 때.
//
// 두 자리가 어긋나 있었다(2026-09-15).
//
// - 금액이 `expenseType === "EXPENSE" ? "−"/지출색 : "+"/수입색` 두 갈래라 이체가
//   **"+12,345" 수입색**으로 나왔다. 이체는 지출도 수입도 아니라 ±로 합계에 들어가지
//   않는다 — 프리셋 목록·상세·가계부 이체 행은 이미 중립색·무부호였다.
// - "저장하려면 먼저 카테고리를 선택해 주세요" 안내가 `categoryRowId == null` 만 봐서
//   이체(카테고리가 없는 게 정상)에 **항상** 떴다. 저장 버튼은 `canSave` 가 이체 분기를
//   봐서 살아 있었으므로 안내와 버튼이 서로 다른 말을 했다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetPointerBlockForTest } from "@/shared/lib/porest/pointer-block";
import type { Asset } from "@/entities/asset";
import type { ExpenseCategory } from "@/entities/expense";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("@/features/expense", () => ({
  useExpenseCategories: () => ({ data: [category], isLoading: false }),
  useExpenseTemplates: () => ({ data: [], isLoading: false }),
  useCreateExpense: () => ({ mutate: () => {}, isPending: false }),
  useUpdateExpense: () => ({ mutate: () => {}, isPending: false }),
  useCreateExpenseTemplate: () => ({ mutate: () => {}, isPending: false }),
  useTouchExpenseTemplate: () => ({ mutate: () => {}, isPending: false }),
}));
vi.mock("@/features/asset", () => ({
  useAssets: () => ({ data: { assets: [bank, savings] }, isLoading: false }),
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
vi.mock("@/features/user", () => ({ useDefaultCurrency: () => "KRW" }));

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

const bank = {
  rowId: 3,
  assetName: "QA예금",
  assetType: "BANK_ACCOUNT",
  institution: null,
} as Asset;
const savings = {
  rowId: 4,
  assetName: "QA적금",
  assetType: "SAVINGS",
  institution: null,
} as Asset;

const { AddTxSheet } = await import("./AddTxSheet");

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  __resetPointerBlockForTest();
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
  act(() =>
    root.render(
      <AddTxSheet onClose={() => {}} mobile={false} expense={null} />,
    ),
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

/** radix Tabs 는 `mousedown` 에서 바꾼다 — `click` 만 쏘면 아무 일도 안 일어난다. */
function switchTab(label: string) {
  const tab = byText<HTMLButtonElement>("button", label);
  if (!tab) throw new Error(`탭을 찾지 못했다: ${label}`);
  act(() => tab.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })));
}

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

function pickOption(triggerText: string, optionText: string) {
  const trigger = byText<HTMLButtonElement>("button", triggerText);
  if (!trigger) throw new Error(`셀렉트를 찾지 못했다: ${triggerText}`);
  act(() => {
    trigger.focus();
    trigger.dispatchEvent(
      new KeyboardEvent("keydown", { key: " ", bubbles: true }),
    );
  });
  const option = byText("[role='option']", optionText);
  if (!option) throw new Error(`항목을 찾지 못했다: ${optionText}`);
  act(() =>
    option.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    ),
  );
}

/** 이체 탭에 금액·계좌를 채우고 "현재 입력값 저장" 을 연다. */
function openSaveDialogForTransfer() {
  switchTab("addTx.transfer");
  const amount = [
    ...document.body.querySelectorAll<HTMLInputElement>("input"),
  ].find((el) => el.placeholder === "0")!;
  setValue(amount, "12345");
  pickOption("addTx.selectPlaceholder", "QA예금");
  pickOption("addTx.selectPlaceholder", "QA적금");
  const open = byText<HTMLButtonElement>("button", "addTx.saveCurrentInput");
  if (!open) throw new Error('"현재 입력값 저장" 버튼을 찾지 못했다');
  expect(open.disabled).toBe(false);
  act(() => open.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

describe("이체를 프리셋으로 저장하는 대화상자", () => {
  it("금액에 + 부호와 수입색을 붙이지 않는다 — 이체는 ±로 합계에 안 들어간다", () => {
    openSaveDialogForTransfer();

    const amountEl = [
      ...document.body.querySelectorAll<HTMLElement>("div.num"),
    ].find((el) => el.textContent?.includes("12,345"));
    expect(amountEl, "미리보기 금액을 찾지 못했다").toBeTruthy();
    expect(amountEl!.textContent?.trim()).toBe("12,345");
    expect(amountEl!.style.color).toContain("--fg-primary");
  });

  it("카테고리 안내를 띄우지 않는다 — 이체는 카테고리가 없는 게 정상이고 저장은 열려 있다", () => {
    openSaveDialogForTransfer();

    expect(byText("div", "savePreset.needCategory")).toBeUndefined();
    // 미리보기 부제는 출금 → 입금.
    expect(
      [...document.body.querySelectorAll("div")].some(
        (el) => el.textContent?.trim() === "QA예금 → QA적금",
      ),
    ).toBe(true);
  });
});
