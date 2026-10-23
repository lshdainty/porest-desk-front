import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight, Eye, EyeOff, Wallet } from "lucide-react";
import {
  Bar,
  BarChart as RcBarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { tileRadius } from "@/shared/lib";
import {
  KRW,
  MINUS,
  money,
  formatChartAxis,
  isEn,
  minusOf,
} from "@/shared/lib/groo/format";
import {
  formatMonthDay,
  formatYearMonth,
  parseLocalDate,
} from "@/shared/lib/date";
import { niceAxis } from "@/shared/lib/groo/chartAxis";
import { HideUnit, MaskAmount, WonUnit } from "@/shared/lib/groo/hide-amounts";
import { expenseSum } from "@/entities/expense";
import { wonPre, useHideAmounts } from "@/shared/lib/groo/hide-amounts-core";
import { useOpenHideAmountsSettings } from "@/shared/lib/groo/hide-amounts-nav";
import { Icon, MonthPicker } from "@/shared/ui/groo/primitives";
import { Donut } from "@/shared/ui/groo/charts";
import { ExpenseRow } from "@/entities/expense";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/shared/ui/chart";
import { PageHead } from "@/shared/ui/groo/page-head";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton as SkeletonBase } from "@/shared/ui/skeleton";
import { useDashboardSummary } from "@/features/dashboard";
import { useAssetSummary } from "@/features/asset";
import {
  useExpenses,
  useExpenseCategories,
  useRangeSummary,
  useMonthlyTrend,
  useExpenseBudgets,
} from "@/features/expense";
import { getPaletteByColor } from "@/shared/lib/groo/chart-palette";
import { useUserPreferences } from "@/features/user";
import { useRecurringTransactions } from "@/features/recurring-transaction";
import type { Expense } from "@/entities/expense";
import {
  computeBudgetItems,
  donutSegments,
  useCurrentMonthKey,
} from "./home-shared";

type BarPayloadItem = {
  dataKey?: string;
  value?: number;
  payload?: Record<string, unknown>;
};
type BarTooltipProps = {
  active?: boolean;
  payload?: BarPayloadItem[];
  label?: string;
};

function IncomeExpenseTooltip({ active, payload, label }: BarTooltipProps) {
  const { t } = useTranslation("dashboard");
  if (!active || !payload || payload.length === 0) return null;
  const income = Number(
    payload.find((p) => p.dataKey === "income")?.value ?? 0,
  );
  const expense = Number(
    payload.find((p) => p.dataKey === "expense")?.value ?? 0,
  );
  const saving = income - expense;
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-tile)",
        boxShadow: "var(--shadow-md)",
        padding: "8px 12px",
        fontSize: "var(--text-caption)",
        minWidth: 140,
      }}
    >
      <div
        style={{
          fontSize: "var(--text-badge)",
          color: "var(--fg-tertiary)",
          fontWeight: "600",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "var(--radius-xs)",
            background: "var(--status-info-fg)",
          }}
        />
        <span
          style={{
            fontSize: "var(--text-badge)",
            color: "var(--fg-secondary)",
          }}
        >
          {t("chart.income")}
        </span>
        <span
          className="num"
          style={{
            marginLeft: "auto",
            fontSize: "var(--text-caption)",
            fontWeight: "700",
          }}
        >
          <MaskAmount card="home.monthExpense" kind="income">
            {wonPre()}
            {KRW(income)}
          </MaskAmount>
          <WonUnit card="home.monthExpense" kind="income" />
        </span>
      </div>
      <div
        style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "var(--radius-xs)",
            background: "var(--color-fg-critical)",
          }}
        />
        <span
          style={{
            fontSize: "var(--text-badge)",
            color: "var(--fg-secondary)",
          }}
        >
          {t("chart.expense")}
        </span>
        <span
          className="num"
          style={{
            marginLeft: "auto",
            fontSize: "var(--text-caption)",
            fontWeight: "700",
          }}
        >
          <MaskAmount card="home.monthExpense" kind="expense">
            {wonPre()}
            {KRW(expense)}
          </MaskAmount>
          <WonUnit card="home.monthExpense" kind="expense" />
        </span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginTop: 5,
          paddingTop: 5,
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <span
          style={{
            fontSize: "var(--text-badge)",
            color: "var(--fg-secondary)",
          }}
        >
          {t("chart.savings")}
        </span>
        <span
          className="num"
          style={{
            marginLeft: "auto",
            fontSize: "var(--text-caption)",
            fontWeight: "700",
            color: saving >= 0 ? "var(--fg-brand)" : "var(--fg-expense)",
          }}
        >
          <MaskAmount card="home.monthExpense" kind="net">
            {saving >= 0 ? "+" : "−"}
            {wonPre()}
            {KRW(Math.abs(saving))}
          </MaskAmount>
          <WonUnit card="home.monthExpense" kind="net" />
        </span>
      </div>
    </div>
  );
}

function IncomeExpenseBarChart({
  data,
  height = 200,
}: {
  data: { label: string; income: number; expense: number }[];
  height?: number;
}) {
  const { t } = useTranslation("dashboard");
  const hidden = useHideAmounts("home.monthExpense");
  const barChartConfig = {
    income: { label: t("chart.income"), color: "var(--status-info-fg)" },
    expense: { label: t("chart.expense"), color: "var(--color-fg-critical)" },
  } satisfies ChartConfig;
  // Y축: 0기준 nice 눈금 (수입·지출 둘 다 포함, 앱 niceAxis 정합).
  const yAxis = useMemo(() => {
    const vals = data.flatMap((d) => [d.income, d.expense]);
    return niceAxis(0, Math.max(0, ...vals));
  }, [data]);
  return (
    <ChartContainer
      config={barChartConfig}
      className="aspect-auto w-full"
      style={{ height }}
    >
      <RcBarChart
        data={data}
        margin={{ top: 16, right: 16, left: 0, bottom: 8 }}
        barGap={8}
        barCategoryGap="55%"
      >
        <CartesianGrid
          vertical={false}
          stroke="var(--border-subtle)"
          strokeDasharray="3 3"
        />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: "var(--text-badge)", fill: "var(--fg-tertiary)" }}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          domain={[yAxis.min, yAxis.max]}
          ticks={yAxis.ticks}
          // 금액 숨기기 시 Y축도 마스킹 ('••••' 4점)
          tickFormatter={(v: number) => (hidden ? "••••" : formatChartAxis(v))}
          tick={{ fontSize: "var(--text-badge)", fill: "var(--fg-tertiary)" }}
          width={48}
        />
        <ChartTooltip
          cursor={{ fill: "var(--bg-brand)", fillOpacity: 0.06 }}
          content={<IncomeExpenseTooltip />}
        />
        <Bar
          dataKey="income"
          fill="var(--color-income)"
          radius={4}
          barSize={28}
        />
        <Bar
          dataKey="expense"
          fill="var(--color-expense)"
          radius={4}
          barSize={28}
        />
      </RcBarChart>
    </ChartContainer>
  );
}

export function HomeDesktop() {
  const { t } = useTranslation("dashboard");
  const { t: tLayout } = useTranslation("layout");
  const { t: tc } = useTranslation("common");
  const navigate = useNavigate();
  const hidden = useHideAmounts();
  // 여기서 바로 가리지 않는다 — 가릴 카드를 고르는 설정으로 보낸다.
  const handleHideToggle = useOpenHideAmountsSettings("home");
  const { key: initialKey } = useCurrentMonthKey();
  const [period, setPeriod] = useState(initialKey);
  const [periodY, periodM] = period.split("-").map(Number) as [number, number];

  const pad2 = (n: number) => String(n).padStart(2, "0");
  const periodStart = `${periodY}-${pad2(periodM)}-01`;
  const periodEnd = `${periodY}-${pad2(periodM)}-${pad2(new Date(periodY, periodM, 0).getDate())}`;

  const dashboardQ = useDashboardSummary();
  const assetSummaryQ = useAssetSummary(periodY, periodM);
  const monthlyQ = useRangeSummary(periodStart, periodEnd);
  const trendQ = useMonthlyTrend(6);
  const recentQ = useExpenses({ startDate: periodStart, endDate: periodEnd });
  const budgetsQ = useExpenseBudgets({ year: periodY, month: periodM });
  const categoriesQ = useExpenseCategories();
  const recurringQ = useRecurringTransactions();
  const preferencesQ = useUserPreferences();
  // 예산 경고 임계값 — 사용자 알람% 설정값(BudgetPage 정합). 미설정 시 85.
  const warnThreshold = preferencesQ.data?.budgetAlertThreshold ?? 85;

  const summary = dashboardQ.data;
  const assetSummary = assetSummaryQ.data;
  const totalAssets = assetSummary?.totalAssets ?? 0;
  const totalDebt = assetSummary?.totalDebt ?? 0;
  const netWorth = assetSummary?.netWorth ?? 0;
  const changeAmount = assetSummary?.changeAmount ?? 0;
  const changePercent = assetSummary?.changePercent ?? 0;
  const isUp = changeAmount >= 0;
  // 지난달 순자산이 0 이면 증감률을 낼 수 없다 — 서버는 그 경우 0.0 을 돌려주는데(0 나누기
  // 회피), 화면은 그걸 '+0.0%' 로 찍어 99조가 늘어도 0% 로 보였다(QA #20).
  const hasLastMonth = (assetSummary?.lastMonthNetWorth ?? 0) !== 0;
  const monthly = monthlyQ.data;
  const income =
    monthly?.totalIncome ?? summary?.expenseSummary.monthlyIncome ?? 0;
  const expense =
    monthly?.totalExpense ?? summary?.expenseSummary.monthlyExpense ?? 0;
  const balance = income - expense;

  const todayDStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();
  // 오늘 쓴 거래만
  const todayTx: Expense[] = (recentQ.data ?? [])
    .slice()
    .filter((t) => t.expenseDate?.slice(0, 10) === todayDStr)
    .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate));
  // 서버 집계와 같은 규칙 — 환불·예정 제외.
  const todayTotal = expenseSum(todayTx);

  // 일평균 + 전월 대비 — 가계부 카드 요약 라인용
  const _today = new Date();
  const _isCurMonth =
    _today.getFullYear() === periodY && _today.getMonth() + 1 === periodM;
  const _daysInMonth = new Date(periodY, periodM, 0).getDate();
  const _dayOfMonth = _isCurMonth ? _today.getDate() : _daysInMonth;
  const dailyAvg = Math.round(expense / Math.max(1, _dayOfMonth));
  const trendArr = trendQ.data ?? [];
  const prevExpense = (() => {
    if (trendArr.length < 2) return 0;
    const idx = trendArr.findIndex(
      (t) => t.year === periodY && t.month === periodM,
    );
    if (idx > 0) return trendArr[idx - 1]?.totalExpense ?? 0;
    return trendArr[trendArr.length - 2]?.totalExpense ?? 0;
  })();
  const savingsPct =
    prevExpense > 0 ? ((prevExpense - expense) / prevExpense) * 100 : 0;

  const donutSegs = donutSegments(
    monthly?.categoryBreakdown,
    categoriesQ.data,
    t,
  );
  const donutTotal = donutSegs.reduce((a, b) => a + b.value, 0);

  const barData = useMemo(() => {
    const trend = trendQ.data ?? [];
    return trend.map((t) => ({
      label: String(t.month).padStart(2, "0"),
      income: t.totalIncome,
      expense: t.totalExpense,
    }));
  }, [trendQ.data]);

  const budgetItems = useMemo(
    () =>
      computeBudgetItems({
        budgets: budgetsQ.data ?? [],
        cats: categoriesQ.data ?? [],
        monthly: monthly,
        warnThreshold,
        allLabel: t("all"),
      }),
    [budgetsQ.data, categoriesQ.data, monthly, warnThreshold, t],
  );

  const upcomingPayments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const recurrings = (recurringQ.data ?? [])
      .filter(
        (r) =>
          r.isActive === "Y" &&
          r.expenseType === "EXPENSE" &&
          r.nextExecutionDate,
      )
      .map((r) => {
        const next = parseLocalDate(r.nextExecutionDate as string) ?? today;
        const d = Math.max(
          0,
          Math.round((next.getTime() - today.getTime()) / 86_400_000),
        );
        return {
          rowId: r.rowId,
          title: r.description || r.merchant || r.categoryName,
          amount: r.amount,
          d,
          dateLabel: formatMonthDay(next, { pad: true }),
          nextIso: r.nextExecutionDate as string,
        };
      })
      .sort((a, b) => a.nextIso.localeCompare(b.nextIso));
    return recurrings.slice(0, 3);
  }, [recurringQ.data]);

  return (
    <div className="dash-grid">
      <div style={{ gridColumn: "1 / -1" }}>
        <PageHead title={tLayout("home")} />
      </div>
      <div className="dash-grid__left">
        <div className="balance-hero" style={{ padding: "28px 32px 24px" }}>
          <div
            className="balance-hero__eyebrow"
            style={{ display: "flex", alignItems: "center" }}
          >
            <Wallet size={14} /> {t("asset.netAsset")} ·{" "}
            {formatYearMonth(new Date(periodY, periodM - 1))}
            <button
              onClick={handleHideToggle}
              title={hidden ? t("showAmount") : t("hideAmount")}
              style={{
                marginLeft: "auto",
                background: "oklch(1 0 0 / 0.12)",
                border: "1px solid oklch(1 0 0 / 0.15)",
                color: "inherit",
                width: 28,
                height: 28,
                borderRadius: "var(--radius-pill)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <div className="balance-hero__amount num">
            {assetSummaryQ.isLoading ? (
              "—"
            ) : (
              <MaskAmount card="home.netWorth">
                {wonPre()}
                {KRW(netWorth)}
              </MaskAmount>
            )}
            {!isEn() && (
              <HideUnit>
                <span className="unit">원</span>
              </HideUnit>
            )}
          </div>
          <div className="balance-hero__sub">
            {hasLastMonth ? (
              <>
                {t("vsLastMonth")}
                <span className={`chg ${isUp ? "up" : "down"}`}>
                  {isUp ? "▲" : "▼"} {Math.abs(changePercent).toFixed(1)}%
                  {changeAmount !== 0 && (
                    <HideUnit>
                      <> ({money(Math.abs(changeAmount))})</>
                    </HideUnit>
                  )}
                </span>
              </>
            ) : (
              // 지난달 기록이 없으면 변화액도 '변화' 가 아니라 그냥 현재 순자산이라 같이 숨긴다.
              t("noLastMonth")
            )}
          </div>
          <div className="balance-hero__split">
            <div>
              <div className="l">{t("asset.totalAsset")}</div>
              <div className="v num">
                <MaskAmount card="home.netWorth">
                  {wonPre()}
                  {KRW(totalAssets)}
                </MaskAmount>
                <WonUnit card="home.netWorth" />
              </div>
            </div>
            <div>
              <div className="l">{t("asset.totalDebt")}</div>
              <div className="v num">
                <MaskAmount card="home.netWorth">
                  {minusOf(totalDebt)}
                  {wonPre()}
                  {KRW(Math.abs(totalDebt))}
                </MaskAmount>
                <WonUnit card="home.netWorth" />
              </div>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>
              {t("summary.monthIncomeExpense", { month: periodM })}
            </CardTitle>
            <MonthPicker value={period} onChange={setPeriod} />
          </CardHeader>
          <CardContent>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 24,
                marginBottom: 20,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "var(--text-caption)",
                    color: "var(--fg-tertiary)",
                    fontWeight: "500",
                    marginBottom: 4,
                  }}
                >
                  {t("chart.income")}
                </div>
                <div
                  className="num"
                  style={{
                    fontSize: "var(--text-display-sm)",
                    fontWeight: "700",
                    color: "var(--fg-brand)",
                    letterSpacing: "-0.022em",
                  }}
                >
                  {monthlyQ.isLoading ? (
                    "—"
                  ) : (
                    <>
                      <MaskAmount card="home.monthExpense" kind="income">
                        +{wonPre()}
                        {KRW(income)}
                      </MaskAmount>
                      <WonUnit card="home.monthExpense" kind="income" />
                    </>
                  )}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "var(--text-caption)",
                    color: "var(--fg-tertiary)",
                    fontWeight: "500",
                    marginBottom: 4,
                  }}
                >
                  {t("chart.expense")}
                </div>
                <div
                  className="num"
                  style={{
                    fontSize: "var(--text-display-sm)",
                    fontWeight: "700",
                    color: "var(--fg-expense)",
                    letterSpacing: "-0.022em",
                  }}
                >
                  {monthlyQ.isLoading ? (
                    "—"
                  ) : (
                    <>
                      <MaskAmount card="home.monthExpense" kind="expense">
                        {minusOf(expense)}
                        {wonPre()}
                        {KRW(Math.abs(expense))}
                      </MaskAmount>
                      <WonUnit card="home.monthExpense" kind="expense" />
                    </>
                  )}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "var(--text-caption)",
                    color: "var(--fg-tertiary)",
                    fontWeight: "500",
                    marginBottom: 4,
                  }}
                >
                  {t("balance")}
                </div>
                <div
                  className="num"
                  style={{
                    fontSize: "var(--text-display-sm)",
                    fontWeight: "700",
                    color: "var(--fg-brand-strong)",
                    letterSpacing: "-0.022em",
                  }}
                >
                  {monthlyQ.isLoading ? (
                    "—"
                  ) : (
                    <>
                      <MaskAmount card="home.monthExpense" kind="net">
                        {balance >= 0 ? "+" : MINUS}
                        {wonPre()}
                        {KRW(Math.abs(balance))}
                      </MaskAmount>
                      <WonUnit card="home.monthExpense" kind="net" />
                    </>
                  )}
                </div>
              </div>
            </div>
            {barData.length > 0 ? (
              <IncomeExpenseBarChart data={barData} height={280} />
            ) : trendQ.isLoading ? (
              <SkeletonBase className="h-[280px] w-full rounded-lg" />
            ) : (
              <div
                style={{
                  height: 280,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--fg-tertiary)",
                  fontSize: "var(--text-label-sm)",
                }}
              >
                {tc("noData")}
              </div>
            )}
            <div
              style={{
                marginTop: 16,
                paddingTop: 14,
                borderTop: "1px solid var(--border-subtle)",
                fontSize: "var(--text-label-sm)",
                color: "var(--fg-secondary)",
                lineHeight: "1.5",
              }}
            >
              {t("avg.dailyAverage")}{" "}
              <span
                className="num"
                style={{ color: "var(--fg-primary)", fontWeight: "700" }}
              >
                <MaskAmount card="home.monthExpense" kind="expense">
                  {wonPre()}
                  {KRW(dailyAvg)}
                </MaskAmount>
              </span>
              <WonUnit card="home.monthExpense" /> {t("avg.spent")}
              {prevExpense > 0 && (
                <>
                  {" "}
                  {t("avg.vsPrev")}{" "}
                  <span
                    style={{
                      color:
                        savingsPct > 0
                          ? "var(--fg-brand-strong)"
                          : "var(--fg-expense)",
                      fontWeight: "700",
                    }}
                  >
                    {Math.abs(savingsPct).toFixed(0)}%
                  </span>{" "}
                  {savingsPct > 0
                    ? t("avg.saving")
                    : savingsPct < 0
                      ? t("avg.spentMore")
                      : t("avg.same")}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <CardTitle>{t("expense.todaySpent")}</CardTitle>
              {todayTotal > 0 && (
                <span
                  className="num"
                  style={{
                    fontSize: "var(--text-label-sm)",
                    color: "var(--fg-expense)",
                    fontWeight: "700",
                  }}
                >
                  <MaskAmount card="home.todaySpend" mask="••••">
                    −{wonPre()}
                    {KRW(todayTotal)}
                  </MaskAmount>
                  <WonUnit card="home.todaySpend" />
                </span>
              )}
            </div>
            <Button
              variant="link"
              className="all h-auto p-0"
              onClick={() => navigate("/desk/expense")}
            >
              {t("viewAll")} <ChevronRight size={14} />
            </Button>
          </CardHeader>
          <CardContent>
            <div>
              {recentQ.isLoading && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {[0, 1].map((i) => (
                    <div
                      key={i}
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <SkeletonBase className="h-10 w-10 rounded-md shrink-0" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <SkeletonBase className="h-4 w-1/2 mb-1.5" />
                        <SkeletonBase className="h-3 w-1/3" />
                      </div>
                      <SkeletonBase className="h-4 w-16 shrink-0" />
                    </div>
                  ))}
                </div>
              )}
              {!recentQ.isLoading && todayTx.length === 0 && (
                <div
                  style={{
                    padding: "24px 0",
                    textAlign: "center",
                    color: "var(--fg-tertiary)",
                    fontSize: "var(--text-label-sm)",
                  }}
                >
                  {t("expense.noTodaySpent")}
                </div>
              )}
              {todayTx.map((t) => (
                <ExpenseRow
                  key={t.rowId}
                  expense={t}
                  onClick={() => {
                    const m = t.expenseDate?.slice(0, 7) ?? "";
                    const params = new URLSearchParams();
                    if (m) params.set("month", m);
                    params.set("txId", String(t.rowId));
                    navigate(`/desk/expense?${params.toString()}`);
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="dash-grid__right">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{t("categoryTitle")}</CardTitle>
            <Button
              variant="link"
              className="all h-auto p-0"
              onClick={() => navigate("/desk/stats")}
            >
              {t("detail")} <ChevronRight size={14} />
            </Button>
          </CardHeader>
          <CardContent>
            {donutSegs.length === 0 ? (
              monthlyQ.isLoading ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 20,
                  }}
                >
                  <SkeletonBase className="h-[160px] w-[160px] rounded-full" />
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <SkeletonBase className="h-2.5 w-2.5 rounded-full shrink-0" />
                        <SkeletonBase className="h-3 flex-1" />
                        <SkeletonBase className="h-3 w-12 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: "32px 0",
                    textAlign: "center",
                    color: "var(--fg-tertiary)",
                    fontSize: "var(--text-label-sm)",
                  }}
                >
                  {t("categoryEmpty")}
                </div>
              )
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 20,
                }}
              >
                <Donut segments={donutSegs} size={160} stroke={22}>
                  <div className="lbl">{t("summary.monthlyExpense")}</div>
                  <div className="val num">
                    <MaskAmount card="home.categoryDonut" mask="••••">
                      {KRW(donutTotal)}
                    </MaskAmount>
                  </div>
                </Donut>
                <div className="cat-legend">
                  {donutSegs.map((s, i) => (
                    <div key={i} className="cat-legend__row">
                      <span
                        className="cat-legend__sw"
                        style={{ background: s.color }}
                      />
                      <span className="cat-legend__name">{s.label}</span>
                      <span className="cat-legend__pct num">
                        {((s.value / donutTotal) * 100).toFixed(0)}%
                      </span>
                      <span className="cat-legend__amt num">
                        <MaskAmount card="home.categoryDonut" mask="••••">
                          {KRW(s.value)}
                        </MaskAmount>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{t("expense.budget")}</CardTitle>
            <Button
              variant="link"
              className="all h-auto p-0"
              onClick={() => navigate("/desk/budget")}
            >
              {t("manageBudget")} <ChevronRight size={14} />
            </Button>
          </CardHeader>
          <CardContent>
            {budgetItems.length === 0 ? (
              budgetsQ.isLoading ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}
                >
                  {[0, 1, 2].map((i) => (
                    <div key={i}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 6,
                        }}
                      >
                        <SkeletonBase className="h-8 w-8 rounded-md shrink-0" />
                        <SkeletonBase className="h-4 w-20" />
                        <SkeletonBase className="h-4 w-24 ml-auto" />
                      </div>
                      <SkeletonBase className="h-1.5 w-full rounded-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: "12px 0",
                    textAlign: "center",
                    color: "var(--fg-tertiary)",
                    fontSize: "var(--text-caption)",
                  }}
                >
                  {t("budget.empty")}
                </div>
              )
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                {budgetItems.map((b) => {
                  const palette = getPaletteByColor(b.color);
                  return (
                    <div key={b.rowId}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: tileRadius(32),
                            background: palette.bg,
                            color: palette.color,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Icon name={b.icon} size={16} strokeWidth={1.9} />
                        </span>
                        <span
                          style={{
                            fontSize: "var(--text-label-sm)",
                            fontWeight: "600",
                          }}
                        >
                          {b.categoryName ?? t("all")}
                        </span>
                        <span
                          className="num"
                          style={{
                            marginLeft: "auto",
                            fontSize: "var(--text-caption)",
                            fontWeight: "600",
                            color:
                              b.state === "over"
                                ? "var(--color-fg-critical)"
                                : "var(--fg-secondary)",
                          }}
                        >
                          <MaskAmount card="home.budget" mask="••••">
                            {KRW(b.spent)}
                          </MaskAmount>
                          <span
                            style={{
                              color: "var(--fg-tertiary)",
                              fontWeight: "500",
                            }}
                          >
                            {" "}
                            /{" "}
                            <MaskAmount card="home.budget" mask="••••">
                              {KRW(b.budgetAmount)}
                            </MaskAmount>
                          </span>
                        </span>
                      </div>
                      <div className="budget-bar">
                        <div
                          className={`budget-bar__fill ${b.state}`}
                          style={{ width: `${Math.min(100, b.pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("payment.upcoming")}</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingPayments.length === 0 ? (
              recurringQ.isLoading ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <SkeletonBase className="h-[38px] w-[38px] rounded-md shrink-0" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <SkeletonBase className="h-4 w-3/4 mb-1.5" />
                        <SkeletonBase className="h-3 w-1/3" />
                      </div>
                      <SkeletonBase className="h-4 w-16 shrink-0" />
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: "12px 0",
                    textAlign: "center",
                    color: "var(--fg-tertiary)",
                    fontSize: "var(--text-caption)",
                  }}
                >
                  {t("payment.empty")}
                </div>
              )
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {upcomingPayments.map((p) => (
                  <div
                    key={p.rowId}
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "var(--radius-tile)",
                        background:
                          p.d <= 7
                            ? "var(--status-warning-subtle)"
                            : "var(--bg-sunken)",
                        color:
                          p.d <= 7
                            ? "var(--color-fg-warning)"
                            : "var(--fg-secondary)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "700",
                        fontSize: "var(--text-body-sm)",
                        letterSpacing: "-0.022em",
                        flexShrink: 0,
                      }}
                    >
                      {t("date:dday", { count: p.d })}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "var(--text-label-sm)",
                          fontWeight: "600",
                          color: "var(--fg-primary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.title}
                      </div>
                      <div
                        style={{
                          fontSize: "var(--text-caption)",
                          color: "var(--fg-tertiary)",
                          marginTop: 1,
                        }}
                      >
                        {p.dateLabel}
                      </div>
                    </div>
                    <div
                      className="num"
                      style={{
                        fontSize: "var(--text-body-sm)",
                        fontWeight: "700",
                        letterSpacing: "-0.012em",
                        color: "var(--fg-expense)",
                      }}
                    >
                      <MaskAmount card="home.upcoming" mask="••••">
                        −{KRW(p.amount)}
                      </MaskAmount>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CardTitle>{t("todo.label")}</CardTitle>
              {(summary?.todoSummary.overDueCount ?? 0) > 0 && (
                <span
                  style={{
                    padding: "1px 6px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "var(--text-badge)",
                    fontWeight: 600,
                    background: "var(--status-danger-subtle)",
                    color: "var(--color-fg-critical)",
                  }}
                >
                  {t("todo.overdueBadge", {
                    count: summary!.todoSummary.overDueCount,
                  })}
                </span>
              )}
            </div>
            <Button
              variant="link"
              className="all h-auto p-0"
              onClick={() => navigate("/desk/todo")}
            >
              {t("manage")} <ChevronRight size={14} />
            </Button>
          </CardHeader>
          <CardContent>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {summary?.recentTodos?.slice(0, 4).map((td) => (
                <div
                  key={td.rowId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 0",
                    borderBottom: "1px solid var(--border-subtle)",
                    cursor: "pointer",
                  }}
                  onClick={() => navigate("/desk/todo")}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "var(--radius-pill)",
                      background:
                        td.priority === "HIGH"
                          ? "var(--color-fg-critical)"
                          : td.priority === "MEDIUM"
                            ? "var(--color-bg-warning-solid)"
                            : "var(--bg-brand)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "var(--text-label-sm)",
                      fontWeight: "500",
                      color: "var(--fg-primary)",
                      flex: 1,
                    }}
                  >
                    {td.title}
                  </span>
                  {td.dueDate && (
                    <span
                      style={{
                        fontSize: "var(--text-badge)",
                        color: "var(--fg-tertiary)",
                      }}
                    >
                      {td.dueDate.slice(5, 10)}
                    </span>
                  )}
                </div>
              ))}
              {(!summary?.recentTodos || summary.recentTodos.length === 0) && (
                <div
                  style={{
                    padding: "12px 0",
                    textAlign: "center",
                    color: "var(--fg-tertiary)",
                    fontSize: "var(--text-caption)",
                  }}
                >
                  {t("todo.empty")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{t("calendar.scheduled")}</CardTitle>
            <button className="all" onClick={() => navigate("/desk/calendar")}>
              {t("calendar.title")} <ChevronRight size={14} />
            </button>
          </CardHeader>
          <CardContent>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {summary?.upcomingEvents?.slice(0, 3).map((ev) => (
                <div
                  key={ev.rowId}
                  style={{ display: "flex", alignItems: "center", gap: 10 }}
                >
                  <span
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "var(--radius-tile)",
                      background:
                        ev.daysUntil <= 3
                          ? "var(--status-warning-subtle)"
                          : "var(--bg-sunken)",
                      color:
                        ev.daysUntil <= 3
                          ? "var(--color-fg-warning)"
                          : "var(--fg-secondary)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "700",
                      fontSize: "var(--text-body-sm)",
                      letterSpacing: "-0.022em",
                      flexShrink: 0,
                    }}
                  >
                    {t("date:dday", { count: ev.daysUntil })}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "var(--text-label-sm)",
                        fontWeight: "600",
                        color: "var(--fg-primary)",
                      }}
                    >
                      {ev.title}
                    </div>
                    <div
                      style={{
                        fontSize: "var(--text-caption)",
                        color: "var(--fg-tertiary)",
                        marginTop: 1,
                      }}
                    >
                      {ev.startDate.slice(5, 10)}
                    </div>
                  </div>
                </div>
              ))}
              {(!summary?.upcomingEvents ||
                summary.upcomingEvents.length === 0) && (
                <div
                  style={{
                    padding: "12px 0",
                    textAlign: "center",
                    color: "var(--fg-tertiary)",
                    fontSize: "var(--text-caption)",
                  }}
                >
                  {t("calendar.empty")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
