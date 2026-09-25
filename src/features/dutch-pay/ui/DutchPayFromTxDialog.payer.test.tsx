// 거래에서 만드는 더치페이의 결제자는 늘 나다(QA 30 3).
//
// 종전엔 isPayer 를 안 실어 서버가 첫 사람을 결제자로 골랐다. "나도 포함" 을 켜면 첫 사람이
// 나라서 우연히 맞았지만, 끄면 첫 사람이 친구라 친구가 결제자로 저장됐다 — 화면 문구
// "내가 전액 결제, 다른 사람 몫만 받아요" 와 정반대다. 이제
//   (1) 켜면: 나 isPayer true, 친구 false
//   (2) 끄면: 나를 0원 결제자로 함께 싣고(목록엔 안 그린다), 친구가 총액을 나눈다
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetPointerBlockForTest } from "@/shared/lib/porest/pointer-block";
import type { Expense } from "@/entities/expense";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string) => k,
    i18n: { language: "ko" },
  }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

let sent: Record<string, unknown> | null = null;
vi.mock("@/features/dutch-pay", () => ({
  useCreateDutchPay: () => ({
    mutate: (v: Record<string, unknown>) => {
      sent = v;
    },
    isPending: false,
  }),
}));
vi.mock("@/features/expense", () => ({
  useExpenseCategories: () => ({ data: [], isLoading: false }),
}));
vi.mock("@/features/user", () => ({
  useCurrentUser: () => ({
    data: { rowId: 1, userName: "나" },
    isLoading: false,
  }),
}));

const { DutchPayFromTxDialog } = await import("./DutchPayFromTxDialog");

const expense = {
  rowId: 9,
  amount: 3_000,
  expenseType: "EXPENSE",
  expenseDate: "2026-09-25T12:00:00",
  merchant: "점심",
  description: null,
  categoryRowId: null,
} as unknown as Expense;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  __resetPointerBlockForTest();
  sent = null;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <DutchPayFromTxDialog
        expense={expense}
        mobile={false}
        onClose={() => {}}
      />,
    ),
  );
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const click = (el: Element) =>
  act(() => el.dispatchEvent(new MouseEvent("click", { bubbles: true })));
const button = (text: string) =>
  [...document.body.querySelectorAll("button")].find(
    (b) => b.textContent?.trim() === text,
  )!;

function addFriend(name: string) {
  const input = [...document.body.querySelectorAll("input")].find(
    (i) => i.getAttribute("placeholder") === "fromTx.addNamePlaceholder",
  ) as HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;
  act(() => {
    setter?.call(input, name);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  click(button("fromTx.add"));
}

type P = { participantName: string; amount: number; isPayer?: boolean };
const participants = () => (sent?.participants ?? []) as P[];

describe("거래에서 더치페이 — 결제자", () => {
  it("나도 포함(기본): 내가 결제자, 친구는 아니다", () => {
    addFriend("친구A");
    click(button("fromTx.createSettlement"));

    expect(participants()).toEqual([
      expect.objectContaining({
        participantName: "나",
        amount: 1_500,
        isPayer: true,
      }),
      expect.objectContaining({
        participantName: "친구A",
        amount: 1_500,
        isPayer: false,
      }),
    ]);
  });

  it("나도 포함 끔: 나를 0원 결제자로 싣고 친구가 총액을 낸다", () => {
    addFriend("친구A");
    click(document.body.querySelector("[role='checkbox']")!);
    click(button("fromTx.createSettlement"));

    expect(participants()).toEqual([
      expect.objectContaining({
        participantName: "나",
        amount: 0,
        isPayer: true,
      }),
      expect.objectContaining({
        participantName: "친구A",
        amount: 3_000,
        isPayer: false,
      }),
    ]);
    expect(participants().filter((p) => p.isPayer)).toHaveLength(1);
  });
});
