// 폰 홈 — 띠 수 · 구역 사이 틈 · 빈 구역 · 실패(I-06 5 · 8 · 33)
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
vi.mock("react-router-dom", () => ({ useNavigate: () => () => {} }));

const q = (data: unknown, extra: object = {}) => ({
  data,
  isError: false,
  refetch: vi.fn(),
  ...extra,
});
const state = {
  summary: q(undefined) as ReturnType<typeof q>,
  asset: q(undefined) as ReturnType<typeof q>,
  monthly: q(undefined) as ReturnType<typeof q>,
  recent: q(undefined) as ReturnType<typeof q>,
  budgets: q(undefined) as ReturnType<typeof q>,
  cats: q(undefined) as ReturnType<typeof q>,
};
vi.mock("@/features/dashboard", () => ({
  useDashboardSummary: () => state.summary,
}));
vi.mock("@/features/asset", () => ({ useAssetSummary: () => state.asset }));
vi.mock("@/features/expense", () => ({
  useRangeSummary: () => state.monthly,
  useExpenses: () => state.recent,
  useExpenseBudgets: () => state.budgets,
  useExpenseCategories: () => state.cats,
}));

const { HomeMobile } = await import("./HomeMobile");

const summary = (events: number, todos: number) => ({
  todoSummary: { overDueCount: 0 },
  expenseSummary: { monthlyIncome: 0, monthlyExpense: 0 },
  upcomingEvents: Array.from({ length: events }, (_, i) => ({
    rowId: i,
    title: `일정 ${i}`,
    color: "",
    daysUntil: i + 1,
    startDate: "2026-10-23T10:00:00",
  })),
  recentTodos: Array.from({ length: todos }, (_, i) => ({
    rowId: i,
    title: `할 일 ${i}`,
    status: "PENDING",
    priority: "HIGH",
    dueDate: null,
  })),
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
  state.asset = q({
    netWorth: 100,
    totalAssets: 100,
    totalDebt: 0,
    lastMonthNetWorth: 0,
  });
  state.monthly = q({ totalIncome: 1, totalExpense: 1, categoryBreakdown: [] });
  state.recent = q([]);
  state.budgets = q([]);
  state.cats = q([]);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
const render = () => act(() => root.render(<HomeMobile />));
const bands = () => container.querySelectorAll(".screen-bands > *");

describe("폰 홈 띠", () => {
  it.each([
    [1, 1, 4],
    [1, 0, 4],
    [0, 1, 4],
    [0, 0, 3],
  ])("일정 %i · 할 일 %i → 띠 %i", (e, t, n) => {
    state.summary = q(summary(e, t));
    render();
    expect(bands()).toHaveLength(n);
    expect(
      (
        container.querySelector(
          "[data-slot=card][data-variant=hero]",
        ) as HTMLElement
      )?.parentElement?.className,
    ).toContain("screen-bands");
    // 띠 ②는 구역 셋
    expect(
      container.querySelectorAll("[data-testid=home-band-month] > section"),
    ).toHaveLength(3);
  });

  it('띠 안 구역 머리는 제목 + 동작 "전체 보기"(꺾쇠 없음)이고 덧붙임은 heading 밖이다', () => {
    state.summary = q(summary(1, 1));
    render();
    const heads = container.querySelectorAll("[data-slot=card-header]");
    expect(heads.length).toBeGreaterThanOrEqual(5);
    expect(container.querySelectorAll("h2").length).toBeGreaterThanOrEqual(5);
    expect(container.querySelector("[data-slot=card-action] svg")).toBeNull();
  });

  it("순자산이 실패하면 0원 대신 그 구역에 실패 + 다시 시도, 다른 구역은 그대로", () => {
    state.summary = q(summary(1, 1));
    const refetch = vi.fn();
    state.asset = q(undefined, { isError: true, refetch });
    render();
    expect(container.textContent).toContain("loadFailed.netWorth");
    expect(container.textContent).not.toContain("0원");
    expect(container.querySelector("[data-section=events]")).not.toBeNull();
    const retry = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Try again"),
    );
    act(() => retry?.click());
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(state.monthly.refetch).not.toHaveBeenCalled();
  });

  it("눈 단추 — 이름 고정 · aria-pressed · 40 상자", () => {
    state.summary = q(summary(0, 0));
    render();
    const eye = container.querySelector(
      "[aria-label=hideAmountsSettings]",
    ) as HTMLElement;
    expect(eye).not.toBeNull();
    expect(eye.getAttribute("aria-pressed")).toBe("false");
    expect(eye.className).toContain("size-10");
    expect(eye.className).not.toMatch(/rounded|bg-white|border-\[/);
  });
});
