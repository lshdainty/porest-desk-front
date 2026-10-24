// 폰 카테고리 목록 제목 줄("지출 카테고리 n개" + 순서 바꾸기) — 불러오는 중 · 실패에는 "0개" 를 그리지 않는다(I-16 검수).
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, p?: { count?: number }) =>
      p?.count != null ? `${k}:${p.count}` : k,
    i18n: { language: "ko" },
  }),
  Trans: ({ children }: { children?: unknown }) => children ?? null,
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

const q: { data: unknown; isLoading: boolean } = {
  data: undefined,
  isLoading: true,
};
const mutation = () => ({ mutate: () => {}, isPending: false });
vi.mock("@/features/expense", () => ({
  useExpenseCategories: () => q,
  useCreateExpenseCategory: mutation,
  useUpdateExpenseCategory: mutation,
  useDeleteExpenseCategory: mutation,
  useReorderExpenseCategories: mutation,
  useExpenseBudgets: () => ({ data: [] }),
  useRangeSummary: () => ({ data: undefined }),
}));
vi.mock("@/features/expense/ui/CategoryMoveTxDialog", () => ({
  CategoryMoveTxDialog: () => null,
}));
vi.mock("./CategoryEditDialog", () => ({ CategoryEditDialog: () => null }));

const { CategoryManager } = await import("./CategoryManager");

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const render = () => act(() => root.render(<CategoryManager mobile />));
const title = () => container.querySelector("h2");

describe("카테고리 목록 제목(폰)", () => {
  it("불러오는 중에는 제목 줄도 순서 바꾸기도 없다", () => {
    q.data = undefined;
    q.isLoading = true;
    render();
    expect(title()).toBeNull();
    expect(container.textContent).not.toContain("reorderEdit");
  });

  it('실패(데이터 없음)에도 "0개" 를 그리지 않는다', () => {
    q.data = undefined;
    q.isLoading = false;
    render();
    expect(title()).toBeNull();
    expect(container.textContent).not.toContain(":0");
  });

  it("불러온 뒤에는 개수가 붙은 제목과 순서 바꾸기가 있다", () => {
    q.data = [
      {
        rowId: 1,
        categoryName: "식비",
        expenseType: "EXPENSE",
        parentRowId: null,
        sortOrder: 1,
        color: "#EF4444",
        icon: "tag",
        children: [],
      },
    ];
    q.isLoading = false;
    render();
    expect(title()?.textContent).toContain("listTitle");
    expect(container.textContent).toContain("reorderEdit");
  });
});
