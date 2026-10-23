import { useMemo, useState } from "react";
import { ScreenBands } from "@/shared/ui/groo/screen-bands";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CalendarClock,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Eye,
  EyeOff,
  Wallet,
} from "lucide-react";
import { tileRadius } from "@/shared/lib";
import { KRW, isEn, minusOf } from "@/shared/lib/groo/format";
import { HideUnit, MaskAmount, WonUnit } from "@/shared/lib/groo/hide-amounts";
import { expenseSum } from "@/entities/expense";
import { wonPre, useHideAmounts } from "@/shared/lib/groo/hide-amounts-core";
import { useOpenHideAmountsSettings } from "@/shared/lib/groo/hide-amounts-nav";
import { Icon } from "@/shared/ui/groo/primitives";
import { Donut } from "@/shared/ui/groo/charts";
import { ExpenseRow } from "@/entities/expense";
import { Skeleton as SkeletonBase } from "@/shared/ui/skeleton";
import {
  useDashboardSummary,
  type DashboardSummary,
} from "@/features/dashboard";
import { useAssetSummary } from "@/features/asset";
import {
  useExpenses,
  useExpenseCategories,
  useRangeSummary,
  useExpenseBudgets,
} from "@/features/expense";
import { getPaletteByColor } from "@/shared/lib/groo/chart-palette";
import { useUserPreferences } from "@/features/user";
import type { Expense } from "@/entities/expense";
import {
  computeBudgetItems,
  donutSegments,
  useCurrentMonthKey,
} from "./home-shared";

export function HomeMobile() {
  const { t } = useTranslation("dashboard");
  const navigate = useNavigate();
  const hidden = useHideAmounts();
  // 여기서 바로 가리지 않는다 — 가릴 카드를 고르는 설정으로 보낸다.
  const handleHideToggle = useOpenHideAmountsSettings("home");
  const { key: initialKey } = useCurrentMonthKey();
  const [period] = useState(initialKey);
  const [year, month] = period.split("-").map(Number) as [number, number];

  const pad2m = (n: number) => String(n).padStart(2, "0");
  const monthStartM = `${year}-${pad2m(month)}-01`;
  const monthEndDayM = new Date(year, month, 0).getDate();
  const monthEndM = `${year}-${pad2m(month)}-${pad2m(monthEndDayM)}`;

  // 전월 — '전월 대비 N% 절약 중이에요' 계산용
  const prevDate = new Date(year, month - 2, 1);
  const prevY = prevDate.getFullYear();
  const prevM = prevDate.getMonth() + 1;
  const prevStart = `${prevY}-${pad2m(prevM)}-01`;
  const prevEndDay = new Date(prevY, prevM, 0).getDate();
  const prevEnd = `${prevY}-${pad2m(prevM)}-${pad2m(prevEndDay)}`;

  const dashboardQ = useDashboardSummary();
  const assetSummaryQ = useAssetSummary(year, month);
  const monthlyQ = useRangeSummary(monthStartM, monthEndM);
  const prevMonthlyQ = useRangeSummary(prevStart, prevEnd);
  const recentQ = useExpenses({ startDate: monthStartM, endDate: monthEndM });
  const budgetsQ = useExpenseBudgets({ year, month });
  const categoriesQ = useExpenseCategories();
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
  // 데스크톱과 같은 규칙 — 지난달 기록이 없으면 증감률 자리를 안내로 바꾼다(QA #20).
  const hasLastMonth = (assetSummary?.lastMonthNetWorth ?? 0) !== 0;
  const income =
    monthlyQ.data?.totalIncome ?? summary?.expenseSummary.monthlyIncome ?? 0;
  const expense =
    monthlyQ.data?.totalExpense ?? summary?.expenseSummary.monthlyExpense ?? 0;
  const prevExpense = prevMonthlyQ.data?.totalExpense ?? 0;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${pad2m(today.getMonth() + 1)}-${pad2m(today.getDate())}`;
  const isCurMonth =
    today.getFullYear() === year && today.getMonth() + 1 === month;
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayOfMonth = isCurMonth ? today.getDate() : daysInMonth;
  const dailyAvg = Math.round(expense / Math.max(1, dayOfMonth));
  const savingsPct =
    prevExpense > 0 ? ((prevExpense - expense) / prevExpense) * 100 : 0;

  // 오늘 쓴 거래만
  const todayTx: Expense[] = (recentQ.data ?? [])
    .slice()
    .filter((t) => t.expenseDate?.slice(0, 10) === todayStr)
    .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate));
  // 서버 집계와 같은 규칙 — 환불·예정 제외.
  const todayTotal = expenseSum(todayTx);

  // 도넛 — 부모 카테고리로 롤업, 전체 표시
  const donutSegs = donutSegments(
    monthlyQ.data?.categoryBreakdown,
    categoriesQ.data,
    t,
  );
  const donutTotal = donutSegs.reduce((a, b) => a + b.value, 0);

  // 예산 — 설정한 전체 표시
  const budgetItems = useMemo(
    () =>
      computeBudgetItems({
        budgets: budgetsQ.data ?? [],
        cats: categoriesQ.data ?? [],
        monthly: monthlyQ.data,
        warnThreshold,
        allLabel: t("all"),
      }),
    [budgetsQ.data, categoriesQ.data, monthlyQ.data, warnThreshold, t],
  );

  return (
    // 폰 구역 화면 — 구역마다 화면 폭 흰 띠, 사이 · 맨 위 8 (I-01 결정 3 · DESIGN Layout "화면 바탕")
    <ScreenBands>
      <div className="balance-hero">
        <div
          className="balance-hero__eyebrow"
          style={{ display: "flex", alignItems: "center" }}
        >
          <Wallet size={13} /> {t("asset.netAsset")}
          <button
            onClick={handleHideToggle}
            title={hidden ? t("showAmount") : t("hideAmount")}
            style={{
              marginLeft: "auto",
              background: "oklch(1 0 0 / 0.12)",
              border: "1px solid oklch(1 0 0 / 0.15)",
              color: "inherit",
              width: 26,
              height: 26,
              borderRadius: "var(--radius-pill)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            {hidden ? <EyeOff size={13} /> : <Eye size={13} />}
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
              </span>
            </>
          ) : (
            t("noLastMonth")
          )}
        </div>
        <div className="balance-hero__split">
          <div>
            <div className="l">{t("asset.assetTab")}</div>
            <div className="v num">
              <MaskAmount card="home.netWorth" mask="••••">
                {KRW(totalAssets)}
              </MaskAmount>
            </div>
          </div>
          <div>
            <div className="l">{t("asset.debtTab")}</div>
            <div className="v num">
              <MaskAmount card="home.netWorth" mask="••••">
                {minusOf(totalDebt)}
                {KRW(Math.abs(totalDebt))}
              </MaskAmount>
            </div>
          </div>
        </div>
      </div>

      {/* 월 가계부 — 카드 벗김: 헤드 + 본문 + 헤어라인. 좌우는 페이지가 쥔다(24). */}
      <div>
        <div
          style={{ display: "flex", alignItems: "center", marginBottom: 12 }}
        >
          <div
            style={{
              fontSize: "var(--text-body-lg)",
              fontWeight: "700",
              letterSpacing: "-0.015em",
            }}
          >
            {t("summary.monthExpenseBook", { month })}
          </div>
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <div>
            <div
              style={{
                fontSize: "var(--text-badge)",
                color: "var(--fg-tertiary)",
                fontWeight: "500",
                marginBottom: 2,
              }}
            >
              {t("chart.income")}
            </div>
            <div
              className="num"
              style={{
                fontSize: "var(--text-title-md)",
                fontWeight: "700",
                color: "var(--fg-brand)",
              }}
            >
              <MaskAmount card="home.monthExpense" kind="income">
                +{KRW(income)}
              </MaskAmount>
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "var(--text-badge)",
                color: "var(--fg-tertiary)",
                fontWeight: "500",
                marginBottom: 2,
              }}
            >
              {t("chart.expense")}
            </div>
            <div
              className="num"
              style={{
                fontSize: "var(--text-title-md)",
                fontWeight: "700",
                color: "var(--fg-expense)",
              }}
            >
              <MaskAmount card="home.monthExpense" kind="expense">
                {minusOf(expense)}
                {KRW(Math.abs(expense))}
              </MaskAmount>
            </div>
          </div>
        </div>
        <div
          style={{
            height: 1,
            background: "var(--border-subtle)",
            margin: "14px 10px",
          }}
        />
        <div
          style={{
            fontSize: "var(--text-caption)",
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
      </div>

      {/* 카테고리 — 카드 벗김: sec-head + 본문(10px 인셋) */}
      <div>
        <div className="sec-head">
          <h2>{t("categoryTitle")}</h2>
          <button className="all" onClick={() => navigate("/desk/stats")}>
            {t("detail")} <ChevronRight size={14} />
          </button>
        </div>
        {donutSegs.length === 0 ? (
          monthlyQ.isLoading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <SkeletonBase className="h-[120px] w-[120px] rounded-full shrink-0" />
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <SkeletonBase className="h-2 w-2 rounded-full shrink-0" />
                    <SkeletonBase className="h-3 flex-1" />
                    <SkeletonBase className="h-3 w-10 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: "24px 0",
                textAlign: "center",
                color: "var(--fg-tertiary)",
                fontSize: "var(--text-caption)",
              }}
            >
              {t("categoryEmptyMobile")}
            </div>
          )
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Donut segments={donutSegs} size={120} stroke={18}>
              <div className="lbl" style={{ fontSize: "var(--text-badge)" }}>
                {t("chart.expense")}
              </div>
              <div
                className="val num"
                style={{ fontSize: "var(--text-caption)" }}
              >
                <MaskAmount card="home.categoryDonut" mask="••••">
                  {KRW(donutTotal)}
                </MaskAmount>
              </div>
            </Donut>
            {/* minWidth 0 — 없으면 긴 금액이 범례 칸을 밀어 띠 밖으로 나간다(이름이 말줄임으로 양보한다) */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {donutSegs.map((s, i) => (
                <div
                  key={i}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "var(--radius-pill)",
                      background: s.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "var(--text-caption)",
                      color: "var(--fg-secondary)",
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.label}
                  </span>
                  <span
                    className="num"
                    style={{
                      fontSize: "var(--text-caption)",
                      color: "var(--fg-primary)",
                      fontWeight: "600",
                      flexShrink: 0,
                    }}
                  >
                    <MaskAmount card="home.categoryDonut" mask="••••">
                      {KRW(s.value)}
                    </MaskAmount>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 예산 — 카드 벗김: sec-head + budget-flat 행 리듬 (design .budget-flat__row) */}
      <div>
        <div className="sec-head" style={{ marginBottom: 14 }}>
          <h2>{t("expense.budget")}</h2>
          <button className="all" onClick={() => navigate("/desk/budget")}>
            {t("all")} <ChevronRight size={14} />
          </button>
        </div>
        {budgetItems.length === 0 ? (
          budgetsQ.isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
                    <SkeletonBase className="h-7 w-7 rounded-md shrink-0" />
                    <SkeletonBase className="h-4 w-20 flex-1" />
                    <SkeletonBase className="h-3 w-24 shrink-0" />
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
          <div>
            {budgetItems.map((b) => {
              const palette = getPaletteByColor(b.color);
              return (
                // 좌우는 페이지가 쥔다(24). 행이 여기서 10 을 얹고 -2 로 당기면 순 8 이
                // 남아, 제목만 24 에 서고 행은 32 에서 시작해 두 줄이 어긋나 보인다.
                <div key={b.rowId} style={{ padding: "14px 0" }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 14 }}
                  >
                    <span
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: tileRadius(40),
                        background: palette.bg,
                        color: palette.color,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon name={b.icon} size={18} strokeWidth={1.9} />
                    </span>
                    <span
                      style={{
                        fontSize: "var(--text-label-sm)",
                        fontWeight: "600",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {b.categoryName}
                    </span>
                    <span
                      className="num"
                      style={{
                        marginLeft: "auto",
                        fontSize: "var(--text-body-lg)",
                        fontWeight: "700",
                        color:
                          b.state === "over"
                            ? "var(--color-fg-critical)"
                            : "var(--fg-primary)",
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
                  <div className="budget-bar" style={{ marginTop: 10 }}>
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
      </div>

      <HomeUpcomingSection
        summary={summary}
        onCalendar={() => navigate("/desk/calendar")}
      />
      <HomeTodosSection
        summary={summary}
        onTodos={() => navigate("/desk/todo")}
      />

      {/* 오늘 쓴 돈 — 카드 벗김: sec-head(baseline) + tx 행 (design .tx-flat) */}
      <div>
        <div
          className="sec-head"
          style={{ marginBottom: 6, alignItems: "baseline" }}
        >
          <h2>{t("expense.todaySpent")}</h2>
          {todayTotal > 0 && (
            <span
              className="num"
              style={{
                fontSize: "var(--text-caption)",
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
          <button className="all" onClick={() => navigate("/desk/expense")}>
            {t("all")}
          </button>
        </div>
        <div>
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
          {todayTx.length === 0 && (
            <div
              style={{
                padding: "12px 0",
                textAlign: "center",
                color: "var(--fg-tertiary)",
                fontSize: "var(--text-caption)",
              }}
            >
              {t("expense.noTodaySpent")}
            </div>
          )}
        </div>
      </div>
    </ScreenBands>
  );
}

// 모바일 홈 위젯 항목 — design screens-home.jsx `.widget-row` 미러(button, full-width, 좌측정렬).
const widgetRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  width: "100%",
  padding: "10px 0",
  background: "transparent",
  border: 0,
  cursor: "pointer",
  textAlign: "left",
  fontFamily: "inherit",
} as const;

// 모바일 홈 위젯 섹션 헤더 — 아이콘16(fg-secondary) + 제목 + 우측 chevron16.
export function WidgetHead({
  icon,
  title,
  onAll,
  extra,
}: {
  icon: React.ReactNode;
  title: string;
  onAll: () => void;
  extra?: React.ReactNode;
}) {
  const { t } = useTranslation("dashboard");
  return (
    <div className="sec-head" style={{ marginBottom: 8 }}>
      <h2 style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
        {icon}
        {title}
        {extra}
      </h2>
      {/* 꺾쇠만 있는 단추 — 이름은 "{구역 제목} 전체 보기"(01-042) */}
      <button
        className="all"
        onClick={onAll}
        type="button"
        aria-label={t("viewAllOf", { title })}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

/**
 * 모바일 홈 — 다가오는 일정 (design screens-home.jsx `HomeUpcoming` 미러).
 * dot8 + 제목14/500 + D-day(임박 n≤3 빨강, 그 외 회색)/700.
 */
function HomeUpcomingSection({
  summary,
  onCalendar,
}: {
  summary: DashboardSummary | undefined;
  onCalendar: () => void;
}) {
  const { t } = useTranslation("dashboard");
  if (!summary) return null;
  const events = summary.upcomingEvents.slice(0, 3);
  if (events.length === 0) return null;

  return (
    <div>
      <WidgetHead
        icon={
          <CalendarClock size={16} style={{ color: "var(--fg-secondary)" }} />
        }
        title={t("schedule.title")}
        onAll={onCalendar}
      />
      <div style={{ display: "flex", flexDirection: "column" }}>
        {events.map((ev) => {
          const urgent = ev.daysUntil <= 3;
          return (
            <button key={ev.rowId} onClick={onCalendar} style={widgetRowStyle}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "var(--radius-pill)",
                  background: ev.color
                    ? getPaletteByColor(ev.color).color
                    : "var(--fg-brand)",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--fg-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  textAlign: "left",
                }}
              >
                {ev.title}
              </span>
              <span
                className="num"
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: urgent
                    ? "var(--color-fg-critical)"
                    : "var(--fg-tertiary)",
                  flexShrink: 0,
                }}
              >
                {ev.daysUntil === 0
                  ? t("schedule.today")
                  : ev.daysUntil === 1
                    ? t("schedule.tomorrow")
                    : t("date:dday", { count: ev.daysUntil })}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 모바일 홈 — 최근 할 일 (design screens-home.jsx `HomeTodos` 미러).
 * 체크써클18(연체 빨강/평소 border-strong) + 제목14/500 + 날짜(연체 빨강)/600.
 */
function HomeTodosSection({
  summary,
  onTodos,
}: {
  summary: DashboardSummary | undefined;
  onTodos: () => void;
}) {
  const { t } = useTranslation("dashboard");
  if (!summary) return null;
  const todos = summary.recentTodos.slice(0, 3);
  if (todos.length === 0) return null;
  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();
  const overdue = summary.todoSummary.overDueCount;

  return (
    <div>
      <WidgetHead
        icon={
          <CheckSquare size={16} style={{ color: "var(--fg-secondary)" }} />
        }
        title={t("todo.recent")}
        onAll={onTodos}
        extra={
          overdue > 0 ? (
            <span
              style={{
                fontSize: "var(--text-badge)",
                fontWeight: 700,
                background: "var(--status-danger-subtle)",
                color: "var(--color-fg-critical)",
                padding: "2px 8px",
                borderRadius: "var(--radius-pill)",
                letterSpacing: "-0.01em",
              }}
            >
              {t("todo.overdueBadge", { count: overdue })}
            </span>
          ) : undefined
        }
      />
      <div style={{ display: "flex", flexDirection: "column" }}>
        {todos.map((td) => {
          const done = td.status === "COMPLETED";
          const isOver =
            !done && !!td.dueDate && td.dueDate.slice(0, 10) < todayStr;
          return (
            <button key={td.rowId} onClick={onTodos} style={widgetRowStyle}>
              {done ? (
                <CheckCircle2
                  size={18}
                  style={{ color: "var(--status-success-fg)", flexShrink: 0 }}
                />
              ) : (
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 999,
                    flexShrink: 0,
                    border: `2px solid ${isOver ? "var(--color-fg-critical)" : "var(--border-strong)"}`,
                  }}
                />
              )}
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--fg-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  textAlign: "left",
                  textDecoration: done ? "line-through" : "none",
                }}
              >
                {td.title}
              </span>
              {td.dueDate && (
                <span
                  className="num"
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: isOver
                      ? "var(--color-fg-critical)"
                      : "var(--fg-tertiary)",
                    flexShrink: 0,
                  }}
                >
                  {td.dueDate.slice(5, 10)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
