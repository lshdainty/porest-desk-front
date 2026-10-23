// 홈 공용 계산 — 도넛 조각(I-06 18)과 예산 줄(22 · 23)
import { describe, expect, it } from "vitest";
import { chartColorOf } from "@/shared/lib/groo/chart-palette";
import { categorySlices, colorSlices, computeBudgetItems } from "./home-shared";

const cat = (rowId: number, color: string | null) => ({
  rowId,
  categoryName: `카테고리 ${rowId}`,
  icon: null,
  color,
  expenseType: "EXPENSE",
  sortOrder: rowId,
  parentRowId: null,
  hasChildren: false,
  createAt: "",
  modifyAt: "",
});
const row = (id: number, amount: number) => ({
  categoryRowId: id,
  categoryName: `카테고리 ${id}`,
  totalAmount: amount,
  parentCategoryRowId: null,
  parentCategoryName: null,
  expenseType: "EXPENSE",
});

describe("도넛 조각", () => {
  it("저장된 팔레트 hex 는 같은 색 이름이다", () => {
    expect(chartColorOf("#2c70bf")).toBe("blue");
    expect(chartColorOf("#C73838")).toBe("red");
    expect(chartColorOf("#123456")).toBeNull();
    expect(chartColorOf(null)).toBeNull();
  });

  it("11 개면 상위 9 + 회색 기타 = 조각 10", () => {
    const ids = Array.from({ length: 11 }, (_, i) => i + 1);
    const slices = categorySlices(
      ids.map((i) => row(i, 1000 - i)) as never,
      ids.map((i) => cat(i, i === 1 ? "#2c70bf" : null)) as never,
      "미분류",
    );
    const colored = colorSlices(slices, "기타");
    expect(colored).toHaveLength(10);
    expect(colored[9]).toMatchObject({ name: "기타", color: "gray" });
    expect(colored[9]?.amount).toBe(1000 - 10 + 1000 - 11);
    // 저장된 색 먼저 — 첫 조각은 blue, 나머지는 blue 를 다시 쓰지 않는다
    expect(colored[0]?.color).toBe("blue");
    expect(colored.slice(1, 9).some((s) => s.color === "blue")).toBe(false);
  });
});

describe("예산 줄", () => {
  it("전체 상한은 이번 달 모든 지출, 카테고리는 쓴 돈 — 경고 색 상태는 없다", () => {
    const items = computeBudgetItems({
      budgets: [
        {
          rowId: 1,
          categoryRowId: null,
          categoryName: null,
          budgetAmount: 3_000_000,
        },
        {
          rowId: 2,
          categoryRowId: 1,
          categoryName: "식비",
          budgetAmount: 800_000,
        },
      ] as never,
      cats: [cat(1, null)] as never,
      monthly: {
        totalExpense: 3_912_345_678,
        categoryBreakdown: [row(1, 1_234_567_890)] as never,
      },
      allLabel: "전체",
    });
    expect(items[0]).toMatchObject({ isAll: true, spent: 3_912_345_678 });
    expect(items[1]).toMatchObject({ isAll: false, spent: 1_234_567_890 });
    expect(Object.keys(items[0] ?? {})).not.toContain("state");
  });
});
