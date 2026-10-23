import { chartColorOf, type ChartKey } from "@/shared/lib/groo/chart-palette";
import { assignChartColors } from "@/shared/ds/chart";
import type {
  ExpenseBudget,
  ExpenseCategory,
  CategoryBreakdown,
} from "@/entities/expense";
import { aggregateByParent } from "@/entities/expense";

export type OutletCtx = { onAddTx: () => void; mobile: boolean };

/**
 * 카테고리 지출 도넛 조각 — 부모 카테고리로 롤업 후 금액 내림차순(큰 순서).
 * 색은 여기서 정하지 않는다 — 저장된 hex 가 차트 10색의 기본 값이면 그 색 이름(`saved`), 아니면 null 로 두고
 * ds `assignChartColors` 가 그 차트에서 쓰지 않은 색을 준다(I-06 18).
 */
export type HomeSlice = {
  id: string;
  name: string;
  amount: number;
  saved: ChartKey | null;
};

export function categorySlices(
  breakdown: CategoryBreakdown[] | undefined,
  cats: ExpenseCategory[] | undefined,
  uncategorizedLabel: string,
): HomeSlice[] {
  const expenseOnly = (breakdown ?? []).filter(
    (c) => c.expenseType === "EXPENSE",
  );
  const catColorMap = new Map<number, string | null | undefined>();
  for (const cat of cats ?? []) catColorMap.set(cat.rowId, cat.color);
  return aggregateByParent(expenseOnly)
    .slice()
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .map((c, i) => ({
      id: `${c.categoryRowId ?? "none"}-${i}`,
      name: c.categoryName ?? uncategorizedLabel,
      amount: c.totalAmount,
      saved:
        c.categoryRowId != null
          ? chartColorOf(catColorMap.get(c.categoryRowId))
          : null,
    }));
}

/** 10개를 넘으면 상위 9 + 회색 "기타" — 색 배정까지 */
export function colorSlices(slices: HomeSlice[], othersLabel: string) {
  return assignChartColors(slices, {
    colorOf: (s) => s.saved,
    groupOthers: (rest) => ({
      id: "others",
      name: othersLabel,
      amount: rest.reduce((a, c) => a + c.amount, 0),
      saved: null,
    }),
  });
}

export function useCurrentMonthKey() {
  const now = new Date();
  return {
    key: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
}

/** 예산 줄 계산 — 데스크톱 · 폰이 같은 코드를 두 벌 갖고 있던 것을 한 벌로(I-06 4). */
export function computeBudgetItems({
  budgets,
  cats,
  monthly,
  allLabel,
}: {
  budgets: ExpenseBudget[];
  cats: ExpenseCategory[];
  monthly:
    | { categoryBreakdown?: CategoryBreakdown[]; totalExpense?: number }
    | undefined;
  allLabel: string;
}) {
  const catMap = new Map<number, ExpenseCategory>();
  for (const c of cats) catMap.set(c.rowId, c);

  const spentByCat = new Map<number, number>();
  for (const c of monthly?.categoryBreakdown ?? []) {
    if (c.expenseType !== "EXPENSE" || c.categoryRowId == null) continue;
    // 본인에 누적
    spentByCat.set(
      c.categoryRowId,
      (spentByCat.get(c.categoryRowId) ?? 0) + c.totalAmount,
    );
    // 예산이 부모(top-level) 에 걸리므로 자식 지출은 부모에도 roll-up.
    if (c.parentCategoryRowId != null) {
      spentByCat.set(
        c.parentCategoryRowId,
        (spentByCat.get(c.parentCategoryRowId) ?? 0) + c.totalAmount,
      );
    }
  }
  const totalExpense = monthly?.totalExpense ?? 0;
  return budgets.map((b) => {
    // 전체 상한(categoryRowId === null) 은 이번 달 모든 EXPENSE 합계를
    // 사용금액으로 사용 — 카테고리 예산이 없는 지출도 포함.
    const spent =
      b.categoryRowId == null
        ? totalExpense
        : (spentByCat.get(b.categoryRowId) ?? 0);
    const cat =
      b.categoryRowId != null ? catMap.get(b.categoryRowId) : undefined;
    return {
      rowId: b.rowId,
      categoryName: cat?.categoryName ?? b.categoryName ?? allLabel,
      budgetAmount: b.budgetAmount,
      spent,
      isAll: b.categoryRowId == null,
    };
  });
}
