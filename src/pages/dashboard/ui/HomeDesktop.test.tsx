// 데스크톱 · 태블릿 홈 — 격자 · 카드 값 · 차트 타일 · 구역 안 실패(I-06 17 · 30 ~ 33)
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
vi.mock("@/shared/ui/groo/primitives", () => ({
  MonthPicker: () => <span data-testid="month-picker" />,
}));

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
  trend: q(undefined) as ReturnType<typeof q>,
  recent: q(undefined) as ReturnType<typeof q>,
  budgets: q(undefined) as ReturnType<typeof q>,
  cats: q(undefined) as ReturnType<typeof q>,
  recurring: q(undefined) as ReturnType<typeof q>,
};
vi.mock("@/features/dashboard", () => ({
  useDashboardSummary: () => state.summary,
}));
vi.mock("@/features/asset", () => ({ useAssetSummary: () => state.asset }));
vi.mock("@/features/recurring-transaction", () => ({
  useRecurringTransactions: () => state.recurring,
}));
vi.mock("@/features/expense", () => ({
  useRangeSummary: () => state.monthly,
  useMonthlyTrend: () => state.trend,
  useExpenses: () => state.recent,
  useExpenseBudgets: () => state.budgets,
  useExpenseCategories: () => state.cats,
}));

const { HomeDesktop } = await import("./HomeDesktop");

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
  state.summary = q({
    todoSummary: { overDueCount: 0 },
    expenseSummary: { monthlyIncome: 0, monthlyExpense: 0 },
    upcomingEvents: [],
    recentTodos: [],
  });
  state.asset = q({
    netWorth: 100,
    totalAssets: 100,
    totalDebt: 0,
    lastMonthNetWorth: 0,
  });
  state.monthly = q({ totalIncome: 1, totalExpense: 1, categoryBreakdown: [] });
  state.trend = q([
    { year: 2026, month: 9, totalIncome: 10, totalExpense: 5 },
    { year: 2026, month: 10, totalIncome: 10, totalExpense: 5 },
  ]);
  state.recent = q([]);
  state.budgets = q([]);
  state.cats = q([]);
  state.recurring = q([]);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
const render = () => act(() => root.render(<HomeDesktop />));

describe("데스크톱 홈", () => {
  it("격자는 minmax(0, ·) 2 : 1 — 오른쪽 열 넘침을 막고 칸 사이 24 · 쌓은 카드 8", () => {
    render();
    const grid = container.querySelector(
      "[data-slot=home-desktop] .grid",
    ) as HTMLElement;
    expect(grid.className).toContain(
      "lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]",
    );
    expect(grid.className).toContain("lg:gap-x6");
    for (const col of Array.from(grid.children))
      expect(col.className).toContain("gap-x2");
    // 본문 최대 720(태블릿) · 1040(1440 이상) 가운데
    const body = container.querySelector(
      "[data-slot=home-desktop] > div",
    ) as HTMLElement;
    expect(body.className).toContain("max-w-[720px]");
    expect(body.className).toContain("lg:max-w-[1040px]");
    expect(body.className).toContain("mx-auto");
  });

  it("카드는 ds Card — 순자산 hero · 목록 카드 4 · 옛 줄 사이 선 0", () => {
    render();
    expect(
      container.querySelectorAll("[data-slot=card][data-variant=hero]"),
    ).toHaveLength(1);
    expect(
      container.querySelectorAll("[data-slot=card][data-body=list]"),
    ).toHaveLength(4);
    expect(container.querySelector("hr, [data-slot=list-divider]")).toBeNull();
  });

  it("수입 · 지출 지표 타일 둘 — 마지막 하나는 끌 수 없고 달 고르기가 있다", () => {
    render();
    const tiles = container.querySelectorAll<HTMLElement>(
      "[data-slot=chart-legend-tile]",
    );
    expect(tiles).toHaveLength(2);
    act(() => tiles[0]?.click());
    const after = container.querySelectorAll<HTMLElement>(
      "[data-slot=chart-legend-tile]",
    );
    expect(after[0]?.getAttribute("aria-pressed")).toBe("false");
    // 하나 남으면 그 타일은 못 끈다
    act(() => after[1]?.click());
    expect(after[1]?.getAttribute("aria-pressed")).toBe("true");
    expect(
      container.querySelector("[data-testid=month-picker]"),
    ).not.toBeNull();
  });

  it("한 질의가 실패하면 그 카드만 실패 — 0원 없음 · 다시 시도는 그 질의 하나만", () => {
    const refetch = vi.fn();
    state.monthly = q(undefined, { isError: true, refetch });
    render();
    expect(container.textContent).toContain("loadFailed.category");
    expect(container.textContent).toContain("loadFailed.month");
    expect(container.textContent).not.toContain("0원");
    const retry = Array.from(container.querySelectorAll("button")).filter((b) =>
      b.textContent?.includes("Try again"),
    );
    expect(retry.length).toBeGreaterThan(0);
    act(() => retry[0]?.click());
    expect(refetch).toHaveBeenCalled();
    expect(state.asset.refetch).not.toHaveBeenCalled();
  });
});
