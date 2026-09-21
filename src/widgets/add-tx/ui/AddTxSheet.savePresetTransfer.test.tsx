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

const sent = vi.hoisted(() => ({
  preset: null as Record<string, unknown> | null,
  touched: [] as number[],
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("@/features/expense", () => ({
  // 저장 뒤 토스트(D4·D9) — 이 파일은 그 갈래를 보지 않는다.
  useLedgerResultToast: () => () => {},
  useReplaceExpense: () => ({ mutate: () => {}, isPending: false }),
  useExpenseCategories: () => ({ data: [category], isLoading: false }),
  useExpenseTemplates: () => ({ data: templates, isLoading: false }),
  useCreateExpense: () => ({ mutate: () => {}, isPending: false }),
  useUpdateExpense: () => ({ mutate: () => {}, isPending: false }),
  useCreateExpenseTemplate: () => ({
    mutate: (data: Record<string, unknown>) => {
      sent.preset = data;
    },
    isPending: false,
  }),
  useTouchExpenseTemplate: () => ({
    mutate: (id: number) => {
      sent.touched.push(id);
    },
    isPending: false,
  }),
}));
vi.mock("@/features/asset", () => ({
  useAssets: () => ({
    data: { assets: [bank, savings, loan] },
    isLoading: false,
  }),
  useCreateTransfer: () => ({
    mutate: (
      _data: unknown,
      opts?: { onSuccess?: () => void; onSettled?: () => void },
    ) => {
      opts?.onSuccess?.();
      opts?.onSettled?.();
    },
    isPending: false,
  }),
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
const loan = {
  rowId: 5,
  assetName: "QA대출",
  assetType: "LOAN",
  institution: null,
} as Asset;

/** 이체 프리셋 하나 — 칩으로 적용해 저장하면 사용 기록이 올라야 한다. */
const templates = [
  {
    rowId: 77,
    userRowId: 1,
    templateName: "적금이체",
    categoryRowId: null,
    categoryName: null,
    assetRowId: 3,
    assetName: "QA예금",
    toAssetRowId: 4,
    toAssetName: "QA적금",
    fee: 500,
    interestAmount: null,
    expenseType: "TRANSFER" as const,
    amount: null,
    description: null,
    merchant: null,
    paymentMethod: null,
    useCount: 1,
    sortOrder: 0,
    lockAmount: "N" as const,
    lastUsedAt: null,
    createAt: "2026-01-01T00:00:00",
    modifyAt: "2026-01-01T00:00:00",
  },
];

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
  sent.preset = null;
  sent.touched = [];
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

describe("이체 프리셋 사용 기록 (#174)", () => {
  it("칩으로 채워 이체를 저장하면 사용 기록이 오른다 — 지출·수입과 같은 규칙", () => {
    switchTab("addTx.transfer");
    // 칩을 눌러 계좌·수수료를 채운다(이 프리셋은 금액이 없다).
    const chip = byText<HTMLButtonElement>("button", "적금이체");
    if (!chip) throw new Error("이체 프리셋 칩을 찾지 못했다");
    act(() => chip.dispatchEvent(new MouseEvent("click", { bubbles: true })));

    const amount = [
      ...document.body.querySelectorAll<HTMLInputElement>("input"),
    ].find((el) => el.placeholder === "0")!;
    setValue(amount, "12345");

    const save = [
      ...document.body.querySelectorAll<HTMLButtonElement>("button"),
    ].find((b) => ["save", "addTx.add"].includes(b.textContent?.trim() ?? ""));
    if (!save) throw new Error("저장 버튼을 찾지 못했다");
    act(() => save.dispatchEvent(new MouseEvent("click", { bubbles: true })));

    // 종전엔 이 분기에만 touch 가 없어 "사용 많은 순" 에서 이체 프리셋만 영영 0 이었다.
    expect(sent.touched).toEqual([77]);
  });
});

describe("이자는 금액을 따라간다 — 시트 저장 대화상자 (2026-09-15 결정)", () => {
  /** 대출로 보내는 이체를 채우고 "현재 입력값 저장" 을 연다. */
  function openSaveDialogToLoan() {
    switchTab("addTx.transfer");
    const amount = [
      ...document.body.querySelectorAll<HTMLInputElement>("input"),
    ].find((el) => el.placeholder === "0")!;
    setValue(amount, "300000");
    pickOption("addTx.selectPlaceholder", "QA예금");
    pickOption("addTx.selectPlaceholder", "QA대출");
    const boxes = [
      ...document.body.querySelectorAll<HTMLInputElement>("input"),
    ].filter((el) => el.placeholder === "0");
    setValue(boxes[boxes.length - 1]!, "20000"); // 이자
    const open = byText<HTMLButtonElement>("button", "addTx.saveCurrentInput");
    act(() => open!.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    const name = [
      ...document.body.querySelectorAll<HTMLInputElement>("input"),
    ].find((el) => el.placeholder === "savePreset.namePlaceholder");
    if (!name) throw new Error("프리셋 이름 칸을 찾지 못했다");
    setValue(name, "대출상환");
  }

  function clickDialogSave() {
    const btns = [
      ...document.body.querySelectorAll<HTMLButtonElement>("button"),
    ].filter((b) => b.textContent?.trim() === "save");
    act(() =>
      btns[btns.length - 1]!.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      ),
    );
  }

  it("금액을 안 저장하면 이자도 안 보낸다 — 매달 달라지는 값이라 박아 두면 틀린다", () => {
    openSaveDialogToLoan();
    clickDialogSave(); // "금액도 함께 저장" 은 기본 해제

    expect(sent.preset).not.toBeNull();
    expect(sent.preset!.amount).toBeUndefined();
    expect(sent.preset!.interestAmount).toBeUndefined();
    // 수수료는 계좌 짝의 성질이라 조건이 다르다(여기선 비어 있어 undefined).
    expect(sent.preset!.expenseType).toBe("TRANSFER");
  });

  it("금액을 함께 저장하면 이자도 실린다", () => {
    openSaveDialogToLoan();
    const check = [
      ...document.body.querySelectorAll<HTMLElement>("[role='checkbox']"),
    ].pop();
    if (!check) throw new Error("금액도 함께 저장 체크를 찾지 못했다");
    act(() => check.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    clickDialogSave();

    expect(sent.preset!.amount).toBe(300000);
    expect(sent.preset!.interestAmount).toBe(20000);
  });
});
