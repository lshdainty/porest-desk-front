import { getPaletteByColor } from "@/shared/lib/groo/chart-palette";
import type {
  ExpenseBudget,
  ExpenseCategory,
  CategoryBreakdown,
} from "@/entities/expense";
import { aggregateByParent } from "@/entities/expense";

export type OutletCtx = { onAddTx: () => void; mobile: boolean };

// groo chart palette 10색 — 카테고리 fallback (카테고리 자체 색이 없을 때만 사용).
// `--color-chart-*` alias 사용 — 라이트/다크에서 base ↔ light variant 자동 swap.
const CATEGORY_PALETTE = [
  "var(--color-chart-blue)",
  "var(--color-chart-green)",
  "var(--color-chart-orange)",
  "var(--color-chart-violet)",
  "var(--color-chart-pink)",
  "var(--color-chart-indigo)",
  "var(--color-chart-red)",
  "var(--color-chart-yellow)",
  "var(--color-chart-brown)",
  "var(--color-chart-gray)",
];

/**
 * 카테고리 지출 도넛 조각 — 부모 카테고리로 롤업 후 금액 내림차순.
 *
 * 데스크톱·모바일 대시보드가 같은 도넛을 그린다. 예전엔 두 컴포넌트가 같은
 * `useMemo` 를 통째로 복사해 갖고 있었는데, 둘 다 `t` 를 의존성에 안 적어
 * (언어를 바꿔도 라벨이 안 따라오는) 같은 결함을 나눠 갖고 있었다.
 * 메모이제이션은 컴파일러에 맡기고, 여기서는 계산만 한다.
 */
export function donutSegments(
  breakdown: CategoryBreakdown[] | undefined,
  cats: ExpenseCategory[] | undefined,
  t: (key: string) => string,
): { value: number; color: string; label: string }[] {
  const expenseOnly = (breakdown ?? []).filter(
    (c) => c.expenseType === "EXPENSE",
  );
  const catColorMap = new Map<number, string | null | undefined>();
  for (const cat of cats ?? []) catColorMap.set(cat.rowId, cat.color);
  const items = aggregateByParent(expenseOnly)
    .slice()
    .sort((a, b) => b.totalAmount - a.totalAmount);
  return items.map((c, i) => {
    // 미분류는 카테고리 메타가 없어 색이 없다 — 팔레트 순번 색으로 떨어진다.
    const raw =
      c.categoryRowId != null ? catColorMap.get(c.categoryRowId) : undefined;
    const color = raw
      ? getPaletteByColor(raw).color
      : (CATEGORY_PALETTE[i % CATEGORY_PALETTE.length] ?? "var(--bg-brand)");
    return {
      value: c.totalAmount,
      color,
      label: c.categoryName ?? t("uncategorized"),
    };
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
  warnThreshold,
  allLabel,
}: {
  budgets: ExpenseBudget[];
  cats: ExpenseCategory[];
  monthly:
    | { categoryBreakdown?: CategoryBreakdown[]; totalExpense?: number }
    | undefined;
  warnThreshold: number;
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
    const pct = b.budgetAmount > 0 ? (spent / b.budgetAmount) * 100 : 0;
    const state = pct > 100 ? "over" : pct > warnThreshold ? "warn" : "";
    const cat =
      b.categoryRowId != null ? catMap.get(b.categoryRowId) : undefined;
    return {
      rowId: b.rowId,
      categoryName: cat?.categoryName ?? b.categoryName ?? allLabel,
      icon: cat?.icon ?? "tag",
      color: cat?.color,
      budgetAmount: b.budgetAmount,
      spent,
      pct,
      state,
    };
  });
}
