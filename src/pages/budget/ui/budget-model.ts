import { useMemo, useState } from "react";
import {
  useBudgetCompliance,
  useExpenseBudgets,
  useExpenseCategories,
  useRangeSummary,
} from "@/features/expense";
import { useUserPreferences } from "@/features/user";
import type { ExpenseBudget, ExpenseCategory } from "@/entities/expense";

const currentMonthKey = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
};

/**
 * 예산 화면의 질의 · 계산 — 폰(BudgetMobile)과 데스크톱(BudgetDesktop)이 같은 코드를 쓴다(I-08 3 — 동작 변화 없는 파일 나누기).
 * 상한 · 페이스 · 상태 집계는 여기서 한 번만 센다.
 */
export function useBudgetModel() {
  const [monthKey, setMonthKey] = useState<string>(currentMonthKey());
  const [year, month] = monthKey.split("-").map(Number) as [number, number];

  const budgetsQ = useExpenseBudgets({ year, month });
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEndDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(monthEndDay).padStart(2, "0")}`;
  const summaryQ = useRangeSummary(monthStart, monthEnd);
  const categoriesQ = useExpenseCategories();
  const complianceQ = useBudgetCompliance(6);
  const preferencesQ = useUserPreferences();

  const warnThreshold = preferencesQ.data?.budgetAlertThreshold ?? 85;
  const warnRatio = warnThreshold / 100;

  const budgets: ExpenseBudget[] = budgetsQ.data ?? [];
  const categoryMap = useMemo(() => {
    const map = new Map<number, ExpenseCategory>();
    for (const c of categoriesQ.data ?? []) map.set(c.rowId, c);
    return map;
  }, [categoriesQ.data]);

  const spentByCategory = useMemo(() => {
    const map = new Map<number, number>();
    for (const c of summaryQ.data?.categoryBreakdown ?? []) {
      // 미분류는 특정 카테고리가 없으니 카테고리 예산에서 빼지 않는다 —
      // 전체 예산에서만 차감된다(서버도 같은 규칙).
      if (c.categoryRowId == null) continue;
      map.set(c.categoryRowId, (map.get(c.categoryRowId) ?? 0) + c.totalAmount);
      if (c.parentCategoryRowId != null) {
        map.set(
          c.parentCategoryRowId,
          (map.get(c.parentCategoryRowId) ?? 0) + c.totalAmount,
        );
      }
    }
    return map;
  }, [summaryQ.data]);

  const totalExpense = summaryQ.data?.totalExpense ?? 0;
  const overallBudget = budgets.find((b) => b.categoryRowId === null);
  const categoryBudgets = budgets.filter((b) => b.categoryRowId !== null);

  // 카테고리 한도 합
  const categoryLimitSum = categoryBudgets.reduce(
    (s, b) => s + b.budgetAmount,
    0,
  );
  // 월 총 예산(overall). 없으면 카테고리 합을 대체 값으로 사용.
  const totalLimit = overallBudget?.budgetAmount ?? categoryLimitSum;
  // 전체 지출은 언제나 이번 달 EXPENSE 총합 (미분류 포함)
  const totalSpent = totalExpense;
  const pct = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

  // 총 예산 대비 카테고리 할당 상태
  const overallLimit = overallBudget?.budgetAmount ?? 0;
  const allocable = overallLimit - categoryLimitSum;
  const overAllocated =
    overallBudget != null && categoryLimitSum > overallLimit;

  // Pace
  const today = new Date();
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayOfMonth =
    today.getFullYear() === year && today.getMonth() + 1 === month
      ? today.getDate()
      : daysInMonth;
  const daysElapsedPct = (dayOfMonth / daysInMonth) * 100;
  const daysRemaining = Math.max(1, daysInMonth - dayOfMonth);
  const dailyActual = Math.round(totalSpent / Math.max(1, dayOfMonth));
  const dailyTarget = Math.round(
    Math.max(0, totalLimit - totalSpent) / daysRemaining,
  );
  const onTrack = pct <= daysElapsedPct + 5;

  // 상태 집계 — "여유" 는 알림 기준(warnRatio) 이하인 카테고리 수다(막대 색이 아니라 셈에만 쓴다)
  const overList = categoryBudgets.filter((b) => {
    if (b.categoryRowId == null) return false;
    const spent = spentByCategory.get(b.categoryRowId) ?? 0;
    return spent > b.budgetAmount;
  });
  const healthyList = categoryBudgets.filter((b) => {
    if (b.categoryRowId == null) return false;
    const spent = spentByCategory.get(b.categoryRowId) ?? 0;
    return b.budgetAmount > 0 && spent / b.budgetAmount <= warnRatio;
  });

  const adjustMonth = (delta: number) => {
    let ny = year;
    let nm = month + delta;
    if (nm < 1) {
      ny -= 1;
      nm = 12;
    }
    if (nm > 12) {
      ny += 1;
      nm = 1;
    }
    setMonthKey(`${ny}-${String(nm).padStart(2, "0")}`);
  };

  return {
    monthKey,
    setMonthKey,
    adjustMonth,
    year,
    month,
    budgetsQ,
    summaryQ,
    categoriesQ,
    complianceQ,
    preferencesQ,
    warnThreshold,
    categoryMap,
    spentByCategory,
    overallBudget,
    categoryBudgets,
    categoryLimitSum,
    totalLimit,
    totalSpent,
    pct,
    overallLimit,
    allocable,
    overAllocated,
    daysElapsedPct,
    dailyActual,
    dailyTarget,
    onTrack,
    overList,
    healthyList,
  };
}

export type BudgetModel = ReturnType<typeof useBudgetModel>;
