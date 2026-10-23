import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ScreenBands } from "@/shared/ui/groo/screen-bands";
import { useDashboardSummary } from "@/features/dashboard";
import { useAssetSummary } from "@/features/asset";
import {
  useExpenses,
  useExpenseCategories,
  useRangeSummary,
  useExpenseBudgets,
} from "@/features/expense";
import { expenseSum, type Expense } from "@/entities/expense";
import { toLocalIso } from "@/shared/lib/groo/format";
import {
  BudgetBody,
  BudgetSkeleton,
  CategoryBody,
  CategorySkeleton,
  EmptyLine,
  EventRows,
  HeroCard,
  HomeHead,
  MonthNote,
  MonthRows,
  OverdueBadge,
  RowsSkeleton,
  SectionFailure,
  TodayRows,
  TodayTotal,
  TodoRows,
} from "./home-parts";
import {
  categorySlices,
  colorSlices,
  computeBudgetItems,
  useCurrentMonthKey,
} from "./home-shared";
import { useOpenHideAmountsSettings } from "@/shared/lib/groo/hide-amounts-nav";
import { useMonthNote } from "./use-month-note";

/**
 * 폰 홈 — 띠 넷(I-06 1A): ① 순자산 ② 이번 달 돈(가계부 · 카테고리 · 예산) ③ 할 일 · 일정 ④ 오늘 쓴 돈.
 * 띠 사이 8, 띠 안 구역 사이는 구역 제목 + 여백(앞 구역 아래 24 + 다음 머리 위 24 = 48). 선 · 틈을 두지 않는다.
 * 앱 `dashboard_screen.dart` 와 같은 구조 · 같은 값이다(짝 1).
 */
export function HomeMobile() {
  const { t } = useTranslation("dashboard");
  const navigate = useNavigate();
  // 여기서 바로 가리지 않는다 — 가릴 카드를 고르는 설정으로 보낸다.
  const handleHideToggle = useOpenHideAmountsSettings("home");
  const { year, month } = useCurrentMonthKey();

  const pad2 = (n: number) => String(n).padStart(2, "0");
  const monthStart = `${year}-${pad2(month)}-01`;
  const monthEnd = `${year}-${pad2(month)}-${pad2(new Date(year, month, 0).getDate())}`;

  const dashboardQ = useDashboardSummary();
  const assetSummaryQ = useAssetSummary(year, month);
  const monthlyQ = useRangeSummary(monthStart, monthEnd);
  const recentQ = useExpenses({ startDate: monthStart, endDate: monthEnd });
  const budgetsQ = useExpenseBudgets({ year, month });
  const categoriesQ = useExpenseCategories();
  const { t: tc } = useTranslation("common");

  const summary = dashboardQ.data;
  const asset = assetSummaryQ.data;
  const monthly = monthlyQ.data;
  const income =
    monthly?.totalIncome ?? summary?.expenseSummary.monthlyIncome ?? 0;
  const expense =
    monthly?.totalExpense ?? summary?.expenseSummary.monthlyExpense ?? 0;
  const note = useMonthNote(year, month, expense);

  const todayStr = toLocalIso(new Date()).slice(0, 10);
  // 오늘 쓴 거래만
  const todayTx: Expense[] = (recentQ.data ?? [])
    .filter((e) => e.expenseDate?.slice(0, 10) === todayStr)
    .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate));
  // 서버 집계와 같은 규칙 — 환불·예정 제외.
  const todayTotal = expenseSum(todayTx);

  const slices = colorSlices(
    categorySlices(
      monthly?.categoryBreakdown,
      categoriesQ.data,
      t("uncategorized"),
    ),
    tc("others"),
  );
  const budgetItems = computeBudgetItems({
    budgets: budgetsQ.data ?? [],
    cats: categoriesQ.data ?? [],
    monthly,
    allLabel: t("all"),
  });

  const events = summary?.upcomingEvents.slice(0, 3) ?? [];
  const todos = summary?.recentTodos.slice(0, 3) ?? [];
  const summaryLoading = dashboardQ.data === undefined && !dashboardQ.isError;
  const summaryFailed = dashboardQ.isError && dashboardQ.data === undefined;
  const monthFailed = monthlyQ.isError && monthlyQ.data === undefined;
  const monthLoading = monthlyQ.data === undefined && !monthlyQ.isError;
  const overdue = summary?.todoSummary.overDueCount ?? 0;
  // 띠 ③ — 둘 다 비면 띠 자체가 없다(빈 흰 띠 · 겹친 틈 없음)
  const showBand3 =
    summaryLoading || summaryFailed || events.length > 0 || todos.length > 0;
  const todayLoading = recentQ.data === undefined && !recentQ.isError;
  const todayFailed = recentQ.isError && recentQ.data === undefined;
  const openToday = (e: Expense) => {
    const m = e.expenseDate?.slice(0, 7) ?? "";
    const params = new URLSearchParams();
    if (m) params.set("month", m);
    params.set("txId", String(e.rowId));
    navigate(`/desk/expense?${params.toString()}`);
  };

  return (
    // 폰 구역 화면 — 띠 사이 8 만 틈이다(머리 아래 · 마지막 띠 아래 없음 — I-05 74 · I-06 6 ~ 7)
    <ScreenBands>
      {/* 띠 ① 순자산 */}
      <HeroCard
        band
        data={{
          loading: assetSummaryQ.data === undefined && !assetSummaryQ.isError,
          failed: assetSummaryQ.isError && assetSummaryQ.data === undefined,
          onRetry: () => void assetSummaryQ.refetch(),
          label: t("asset.netAsset"),
          netWorth: asset?.netWorth ?? 0,
          totalAssets: asset?.totalAssets ?? 0,
          totalDebt: asset?.totalDebt ?? 0,
          // 지난달 순자산이 0 이면 증감률을 낼 수 없다 — 안내 글로 바꾼다(QA #20).
          hasLastMonth: (asset?.lastMonthNetWorth ?? 0) !== 0,
          changePercent: asset?.changePercent ?? 0,
          changeAmount: asset?.changeAmount ?? 0,
          showChangeAmount: false,
          assetLabel: t("asset.assetTab"),
          debtLabel: t("asset.debtTab"),
          onHideSettings: handleHideToggle,
        }}
      />

      {/* 띠 ② 이번 달 돈 */}
      <div data-band="flush" data-testid="home-band-month">
        <section data-section="month">
          <HomeHead
            band
            list
            title={t("summary.monthExpenseBook", { month })}
          />
          {monthFailed ? (
            <SectionFailure
              band
              title={t("loadFailed.month")}
              onRetry={() => void monthlyQ.refetch()}
            />
          ) : monthLoading ? (
            <RowsSkeleton rows={2} />
          ) : (
            <>
              <MonthRows income={income} expense={expense} />
              <div className="px-x6 pb-x6">
                <MonthNote {...note} />
              </div>
            </>
          )}
        </section>
        <section data-section="category">
          <HomeHead
            band
            title={t("categoryTitle")}
            action={{
              label: t("viewAll"),
              onClick: () => navigate("/desk/stats"),
            }}
          />
          <div className="px-x6 pb-x6">
            {monthFailed ? (
              <SectionFailure
                title={t("loadFailed.category")}
                onRetry={() => void monthlyQ.refetch()}
              />
            ) : monthLoading ? (
              <CategorySkeleton size={120} />
            ) : slices.length === 0 ? (
              <EmptyLine>{t("categoryEmptyNow")}</EmptyLine>
            ) : (
              <CategoryBody
                slices={slices}
                size={120}
                center={false}
                month={month}
              />
            )}
          </div>
        </section>
        <section data-section="budget">
          <HomeHead
            band
            title={t("expense.budget")}
            action={{
              label: t("viewAll"),
              onClick: () => navigate("/desk/budget"),
            }}
          />
          <div className="px-x6 pb-x6">
            {monthFailed || (budgetsQ.isError && !budgetsQ.data) ? (
              <SectionFailure
                title={t("loadFailed.budget")}
                onRetry={() => {
                  void monthlyQ.refetch();
                  void budgetsQ.refetch();
                }}
              />
            ) : budgetsQ.data === undefined || monthLoading ? (
              <BudgetSkeleton />
            ) : budgetItems.length === 0 ? (
              <EmptyLine>{t("budget.empty")}</EmptyLine>
            ) : (
              <BudgetBody items={budgetItems} />
            )}
          </div>
        </section>
      </div>

      {/* 띠 ③ 할 일 · 일정 — 둘 다 비면 띠가 없다 */}
      {showBand3 && (
        <div data-band="flush" data-testid="home-band-plan">
          {summaryFailed ? (
            <SectionFailure
              band
              title={t("loadFailed.summary")}
              onRetry={() => void dashboardQ.refetch()}
            />
          ) : (
            <>
              {(summaryLoading || events.length > 0) && (
                <section data-section="events">
                  <HomeHead
                    band
                    list
                    title={t("schedule.title")}
                    action={{
                      label: t("viewAll"),
                      onClick: () => navigate("/desk/calendar"),
                    }}
                  />
                  {summaryLoading ? (
                    <RowsSkeleton />
                  ) : (
                    <div className="pb-x3">
                      <EventRows
                        events={events}
                        onOpen={() => navigate("/desk/calendar")}
                      />
                    </div>
                  )}
                </section>
              )}
              {(summaryLoading || todos.length > 0) && (
                <section data-section="todos">
                  <HomeHead
                    band
                    list
                    title={t("todo.recent")}
                    suffix={
                      overdue > 0 ? <OverdueBadge count={overdue} /> : undefined
                    }
                    action={{
                      label: t("viewAll"),
                      onClick: () => navigate("/desk/todo"),
                    }}
                  />
                  {summaryLoading ? (
                    <RowsSkeleton />
                  ) : (
                    <div className="pb-x3">
                      <TodoRows
                        todos={todos}
                        todayStr={todayStr}
                        onOpen={() => navigate("/desk/todo")}
                      />
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      )}

      {/* 띠 ④ 오늘 쓴 돈 */}
      <div data-band="flush" data-testid="home-band-today">
        <section data-section="today">
          <HomeHead
            band
            list
            title={t("expense.todaySpent")}
            suffix={
              todayTotal > 0 ? <TodayTotal total={todayTotal} /> : undefined
            }
            action={{
              label: t("viewAll"),
              onClick: () => navigate("/desk/expense"),
            }}
          />
          {todayFailed ? (
            <SectionFailure
              band
              title={t("loadFailed.today")}
              onRetry={() => void recentQ.refetch()}
            />
          ) : todayLoading ? (
            <RowsSkeleton />
          ) : todayTx.length === 0 ? (
            <div className="pb-x3">
              <EmptyLine>{t("expense.noTodaySpent")}</EmptyLine>
            </div>
          ) : (
            <div className="pb-x3">
              <TodayRows items={todayTx} onOpen={openToday} />
            </div>
          )}
        </section>
      </div>
    </ScreenBands>
  );
}
