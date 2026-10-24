// 예산 설정 폰 — 흰 면 하나(카드 · 선 없음) · 총 예산 막대 넘침 critical · 금액 원까지 · 실패(I-08 18 ~ 23)
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, o?: Record<string, unknown>) =>
      o ? `${k}${JSON.stringify(o)}` : k,
    i18n: { language: "ko" },
  }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname: "/", search: "" }),
}));
vi.mock("@/shared/ui/groo/primitives", () => ({
  MonthPicker: () => <button type="button">월</button>,
  Icon: () => <svg />,
}));
vi.mock("./BudgetEditDialog", () => ({
  BudgetEditDialog: () => null,
  MonthlyBudgetDialog: () => null,
}));

const q = (data: unknown, extra: object = {}) => ({
  data,
  isError: false,
  isLoading: data === undefined,
  refetch: vi.fn(),
  ...extra,
});
const state = {
  budgets: q(undefined) as ReturnType<typeof q>,
  summary: q(undefined) as ReturnType<typeof q>,
  cats: q(undefined) as ReturnType<typeof q>,
};
const mut = () => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isPending: false,
});
vi.mock("@/features/expense", () => ({
  useExpenseBudgets: () => state.budgets,
  useRangeSummary: () => state.summary,
  useExpenseCategories: () => state.cats,
  useCreateExpenseBudget: mut,
  useUpdateExpenseBudget: mut,
  useDeleteExpenseBudget: mut,
}));

const { BudgetManager } = await import("./BudgetManager");
const { setHiddenCards } = await import("@/shared/lib/groo/hide-amounts-core");

const now = new Date();
const b = (rowId: number, categoryRowId: number | null, amount: number) => ({
  rowId,
  categoryRowId,
  categoryName: categoryRowId == null ? null : `카테고리 ${categoryRowId}`,
  budgetAmount: amount,
  budgetYear: now.getFullYear(),
  budgetMonth: now.getMonth() + 1,
});
const cat = (rowId: number) => ({
  rowId,
  categoryName: `카테고리명 ${rowId}`,
  icon: "tag",
  color: null,
  expenseType: "EXPENSE",
  parentRowId: null,
});

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  state.budgets = q([b(1, null, 1_000_000), b(2, 1, 800_000)]);
  state.summary = q({
    totalExpense: 1_234_567,
    categoryBreakdown: [
      {
        categoryRowId: 1,
        parentCategoryRowId: null,
        totalAmount: 900_000,
        expenseType: "EXPENSE",
      },
    ],
  });
  state.cats = q([cat(1), cat(2)]);
});
afterEach(() => {
  act(() => setHiddenCards([]));
  act(() => root.unmount());
  container.remove();
});
const render = (mobile = true) =>
  act(() => root.render(<BudgetManager mobile={mobile} />));

describe("예산 설정 폰 — 흰 면 하나(I-08 18 · 21)", () => {
  it("테두리 카드 · 줄 사이 선이 없다 — 달 줄이 맨 위", () => {
    render();
    expect(container.querySelector("[data-slot=card]")).toBeNull();
    expect(container.querySelector("hr, [data-slot=list-divider]")).toBeNull();
    expect(
      container.firstElementChild?.firstElementChild?.getAttribute("data-slot"),
    ).toBe("month-bar");
  });

  it("총 예산 막대 — 써서 넘치면 critical(over), 줄 막대도 같은 규칙", () => {
    render();
    const meters = container.querySelectorAll("[role=meter]");
    expect(meters.length).toBe(2);
    // 총 예산 1,000,000 에 1,234,567 → 넘침, 카테고리 800,000 에 900,000 → 넘침
    for (const m of Array.from(meters))
      expect(m.getAttribute("data-state")).toBe("over");
    state.summary = q({ totalExpense: 500_000, categoryBreakdown: [] });
    render();
    for (const m of Array.from(container.querySelectorAll("[role=meter]")))
      expect(m.getAttribute("data-state")).toBe("enabled");
  });

  it("금액은 원까지 · 이름은 말줄임 없이(긴 이름) · 줄은 누르는 줄", () => {
    state.cats = q([
      {
        ...cat(1),
        categoryName: "주거·관리비·공과금·통신 요금 자동이체 묶음",
      },
    ]);
    render();
    expect(container.textContent).toContain("1,234,567");
    expect(container.textContent).toContain(
      "주거·관리비·공과금·통신 요금 자동이체 묶음",
    );
    expect(container.querySelector(".truncate, .text-ellipsis")).toBeNull();
    expect(
      container.querySelector("[data-slot=list-title]")?.className ?? "",
    ).not.toContain("nowrap");
    expect(container.querySelector("li button")).not.toBeNull();
  });

  it("지표 셋은 키-값 줄 · 할당 가능 넘침은 U+2212 + critical", () => {
    state.budgets = q([b(1, null, 100_000), b(2, 1, 800_000)]);
    render();
    const vals = container.querySelectorAll("[data-slot=kv-value]");
    expect(vals).toHaveLength(3);
    expect(vals[2]!.textContent).toMatch(/^−.*700,000$/);
    expect(vals[2]!.className).toContain("text-fg-critical");
    expect(container.textContent).toContain("manager.overCap");
  });

  it("가림(budget.manage) — 금액이 ••••", () => {
    render();
    act(() => setHiddenCards(["budget.manage"]));
    expect(container.textContent).not.toContain("1,234,567");
    expect(container.textContent).toContain("••••");
  });
});

describe("예산 설정 — 불러오는 중 · 실패(I-08 23)", () => {
  it("질의 실패 → 설정 안 됨 · 빈 목록이 아니라 다시 시도", () => {
    state.budgets = q(undefined, { isError: true, isLoading: false });
    render();
    expect(container.textContent).toContain("manager.loadFailed");
    expect(container.textContent).not.toContain("manager.notSet");
    expect(container.textContent).not.toContain("manager.emptyCategory");
    const retry = container.querySelector("[data-slot=result-section] button");
    act(() => (retry as HTMLButtonElement).click());
    expect(state.budgets.refetch).toHaveBeenCalled();
  });

  it("불러오는 중에도 달 줄은 있다", () => {
    state.budgets = q(undefined);
    render();
    expect(container.querySelector("[data-slot=month-bar]")).not.toBeNull();
  });
});

describe("예산 설정 데스크톱 — 카드 그대로, 줄 끝 수정 · 삭제 아이콘 이름", () => {
  it("아이콘 버튼 이름이 카테고리를 말한다", () => {
    render(false);
    expect(container.querySelector("[data-slot=card]")).not.toBeNull();
    const names = Array.from(container.querySelectorAll("button")).map((x) =>
      x.getAttribute("aria-label"),
    );
    expect(names.some((n) => n?.startsWith("manager.editNamed"))).toBe(true);
    expect(names.some((n) => n?.startsWith("manager.deleteNamed"))).toBe(true);
  });
});
