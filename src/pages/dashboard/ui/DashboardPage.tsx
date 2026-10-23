import { useOutletContext } from "react-router-dom";
import { useDashboardSummary } from "@/features/dashboard";
import { useAssetSummary } from "@/features/asset";
import {
  useExpenses,
  useExpenseCategories,
  useRangeSummary,
  useMonthlyTrend,
  useExpenseBudgets,
} from "@/features/expense";
import { useRecurringTransactions } from "@/features/recurring-transaction";
import { useCurrentMonthKey, type OutletCtx } from "./home-shared";
import { DashboardPageSkeleton } from "./HomeSkeleton";
import { HomeDesktop } from "./HomeDesktop";
import { HomeMobile } from "./HomeMobile";

/**
 * Dashboard 페이지 진입 시 사용하는 모든 useQuery 의 isLoading 을 한곳에서 집계.
 * desktop/mobile 공통 — 같은 쿼리들이 재호출되어도 캐시 hit.
 */
function useDashboardPageData(
  year: number,
  month: number,
  opts?: { includePrevMonth?: boolean },
) {
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const monthStart = `${year}-${pad2(month)}-01`;
  const monthEnd = `${year}-${pad2(month)}-${pad2(new Date(year, month, 0).getDate())}`;

  const dashboardQ = useDashboardSummary();
  const assetSummaryQ = useAssetSummary(year, month);
  const monthlyQ = useRangeSummary(monthStart, monthEnd);
  const trendQ = useMonthlyTrend(6);
  const recentQ = useExpenses({ startDate: monthStart, endDate: monthEnd });
  const budgetsQ = useExpenseBudgets({ year, month });
  const categoriesQ = useExpenseCategories();
  const recurringQ = useRecurringTransactions();

  // mobile 전용 — 전월 비교용 range summary
  const prevDate = new Date(year, month - 2, 1);
  const prevY = prevDate.getFullYear();
  const prevM = prevDate.getMonth() + 1;
  const prevStart = `${prevY}-${pad2(prevM)}-01`;
  const prevEnd = `${prevY}-${pad2(prevM)}-${pad2(new Date(prevY, prevM, 0).getDate())}`;
  const prevMonthlyQ = useRangeSummary(
    opts?.includePrevMonth ? prevStart : "",
    opts?.includePrevMonth ? prevEnd : "",
  );

  return {
    isLoading:
      dashboardQ.isLoading ||
      assetSummaryQ.isLoading ||
      monthlyQ.isLoading ||
      trendQ.isLoading ||
      recentQ.isLoading ||
      budgetsQ.isLoading ||
      categoriesQ.isLoading ||
      recurringQ.isLoading ||
      (opts?.includePrevMonth ? prevMonthlyQ.isLoading : false),
  };
}

export const DashboardPage = () => {
  const { mobile } = useOutletContext<OutletCtx>();
  const { key } = useCurrentMonthKey();
  const [year, month] = key.split("-").map(Number) as [number, number];
  const { isLoading } = useDashboardPageData(year, month, {
    includePrevMonth: mobile,
  });
  if (isLoading) return <DashboardPageSkeleton mobile={mobile} />;
  return mobile ? <HomeMobile /> : <HomeDesktop />;
};
