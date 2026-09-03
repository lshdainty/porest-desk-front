// 월 요약이 부호를 손으로 박고 있었다 — 지출은 `-{KRW(v)}`, 수입은 `+{KRW(v)}`.
//
// 두 가지가 같이 틀린다 — 하이픈이 ASCII 라 같은 카드 안의 `−` 와 폭이 갈리고(QA #22),
// 반복 지출이 하나도 없으면 `-0` 이 남는다(QA #1). 둘 다 공용 `minusOf` 가 이미
// 해결한 문제이고, 앱 `RecurringScreen` 은 #317 에서 그렇게 갔다
// (`krwSigned(monthlyExpense.abs(), masked, sign: minusOf(monthlyExpense))`).
// 같은 화면을 두 플랫폼이 그리므로 **글자가 갈리면 안 된다.**
//
// 수입 쪽 `+0` 은 그대로 남아 있었다 — 반복 수입이 하나도 없으면 지출 칸은 `0`,
// 바로 옆 수입 칸은 `+0` 이었다. 같은 결함이라 같은 헬퍼(`plusOf`)로 닫는다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MINUS } from "@/shared/lib/porest/format";
import type { RecurringTransaction } from "@/entities/recurring-transaction";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const state = vi.hoisted(() => ({ items: [] as RecurringTransaction[] }));

vi.mock("@/features/recurring-transaction", () => ({
  useRecurringTransactions: () => ({ data: state.items, isLoading: false }),
  useToggleRecurringTransaction: () => ({ mutate: () => {} }),
  useDeleteRecurringTransaction: () => ({ mutate: () => {} }),
}));
vi.mock("@/features/expense", () => ({
  useExpenseCategories: () => ({ data: [], isLoading: false }),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
// 추가·상세 다이얼로그는 자체 쿼리를 여럿 건다 — 여기선 요약 숫자만 본다.
vi.mock("@/features/recurring-transaction/ui/RecurringAddDialog", () => ({
  RecurringAddDialog: () => null,
}));
vi.mock("@/features/recurring-transaction/ui/RecurringDetailDialog", () => ({
  RecurringDetailDialog: () => null,
}));

const { RecurringManager } = await import("./RecurringManager");

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  state.items = [];
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const txOf = (
  amount: number,
  expenseType: "EXPENSE" | "INCOME" = "EXPENSE",
): RecurringTransaction => ({
  rowId: 1,
  userRowId: 1,
  categoryRowId: null,
  categoryName: null,
  assetRowId: null,
  assetName: null,
  sourceExpenseRowId: null,
  expenseType,
  amount,
  description: "구독",
  merchant: null,
  paymentMethod: null,
  frequency: "MONTHLY",
  intervalValue: 1,
  dayOfWeek: null,
  dayOfMonth: 1,
  executionTime: null,
  startDate: "2026-01-01",
  endDate: null,
  maxOccurrences: null,
  executedCount: 0,
  nextExecutionDate: "2099-01-01",
  lastExecutedAt: null,
  isActive: "Y",
  autoLog: false,
  notifyDayBefore: false,
  createAt: "2026-01-01T00:00:00",
  modifyAt: "2026-01-01T00:00:00",
});

/** 모바일·데스크톱이 요약을 따로 그린다 — 한쪽만 고치면 다른 쪽에 그대로 남는다. */
function render(mobile: boolean): string {
  act(() => root.render(<RecurringManager mobile={mobile} />));
  return container.textContent ?? "";
}

describe.each([
  ["모바일", true],
  ["데스크톱", false],
])("반복 거래 월 지출 요약 (%s)", (_label, mobile) => {
  it("반복 지출이 없으면 `-0` 이 아니라 `0` 이다(QA #1)", () => {
    state.items = [];
    const out = render(mobile);
    expect(out).not.toContain("-0");
    expect(out).not.toContain(`${MINUS}0`);
  });

  it("부호는 U+2212 — ASCII 하이픈이 아니다(QA #22)", () => {
    state.items = [txOf(7_560)];
    const out = render(mobile);
    expect(out).toContain(`${MINUS}7,560`);
    expect(out).not.toContain("-7,560");
  });
});

describe.each([
  ["모바일", true],
  ["데스크톱", false],
])("반복 거래 월 수입 요약 (%s)", (_label, mobile) => {
  it("반복 수입이 없으면 `+0` 이 아니라 `0` 이다 — 지출 `−0` 과 같은 결함(QA #1)", () => {
    state.items = [];
    const out = render(mobile);
    expect(out).not.toContain("+0");
  });

  it("지출만 있어도 수입 칸에 `+0` 이 남지 않는다", () => {
    state.items = [txOf(7_560)];
    const out = render(mobile);
    expect(out).not.toContain("+0");
  });

  it("수입이 있으면 `+` 를 붙인다", () => {
    state.items = [txOf(3_200_000, "INCOME")];
    const out = render(mobile);
    expect(out).toContain("+3,200,000");
  });
});
