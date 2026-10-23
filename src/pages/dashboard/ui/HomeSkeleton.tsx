import { useState } from "react";
import { WidgetHead } from "./HomeMobile";
import { ScreenBands } from "@/shared/ui/groo/screen-bands";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CalendarClock, CheckSquare, ChevronRight, Wallet } from "lucide-react";
import { formatYearMonth } from "@/shared/lib/date";
import { MonthPicker } from "@/shared/ui/groo/primitives";
import { PageHead } from "@/shared/ui/groo/page-head";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton as SkeletonBase } from "@/shared/ui/skeleton";
import { useCurrentMonthKey } from "./home-shared";

/**
 * Dashboard 페이지 구조에 맞춘 skeleton. 정적 틀(헤더 타이틀/MonthPicker/링크/hero 라벨)은
 * 실제 렌더하고 서버 데이터 영역만 스켈레톤. desktop 2-col(좌 hero+수입지출+오늘 / 우 카테고리+예산+예정+할일+일정).
 */
export function DashboardPageSkeleton({ mobile }: { mobile: boolean }) {
  const { t } = useTranslation("dashboard");
  const { t: tLayout } = useTranslation("layout");
  const navigate = useNavigate();
  const { key: initialKey, year, month } = useCurrentMonthKey();
  const [period, setPeriod] = useState(initialKey);
  if (mobile) {
    return (
      // 폰 구역 화면 — 구역마다 화면 폭 흰 띠(I-01 결정 3, 실제 렌더와 같은 구조)
      <ScreenBands>
        <DashboardHeroSkeleton mobile year={year} month={month} />
        <DashboardSummaryCardSkeleton
          mobile
          month={month}
          period={period}
          onPeriodChange={setPeriod}
        />
        <DashboardCategoryCardSkeleton
          mobile
          onDetail={() => navigate("/desk/stats")}
        />
        <DashboardBudgetCardSkeleton
          mobile
          onManage={() => navigate("/desk/budget")}
        />
        <DashboardWidgetSectionSkeleton
          icon={
            <CalendarClock size={16} style={{ color: "var(--fg-secondary)" }} />
          }
          title={t("schedule.title")}
          onAll={() => navigate("/desk/calendar")}
          marker="dot"
          rows={3}
        />
        <DashboardWidgetSectionSkeleton
          icon={
            <CheckSquare size={16} style={{ color: "var(--fg-secondary)" }} />
          }
          title={t("todo.recent")}
          onAll={() => navigate("/desk/todo")}
          marker="check"
          rows={3}
        />
        <DashboardListCardSkeleton
          mobile
          title={t("expense.todaySpent")}
          allLabel={t("all")}
          onAll={() => navigate("/desk/expense")}
          rows={3}
          variant="tx"
          amount
        />
      </ScreenBands>
    );
  }
  return (
    <div className="dash-grid">
      <div style={{ gridColumn: "1 / -1" }}>
        <PageHead title={tLayout("home")} />
      </div>
      <div className="dash-grid__left">
        <DashboardHeroSkeleton mobile={false} year={year} month={month} />
        <DashboardSummaryCardSkeleton
          mobile={false}
          month={month}
          period={period}
          onPeriodChange={setPeriod}
        />
        <DashboardListCardSkeleton
          title={t("expense.todaySpent")}
          allLabel={t("viewAll")}
          onAll={() => navigate("/desk/expense")}
          rows={3}
          variant="tx"
          amount
        />
      </div>
      <div className="dash-grid__right">
        <DashboardCategoryCardSkeleton
          mobile={false}
          onDetail={() => navigate("/desk/stats")}
        />
        <DashboardBudgetCardSkeleton
          mobile={false}
          onManage={() => navigate("/desk/budget")}
        />
        <DashboardListCardSkeleton
          title={t("payment.upcoming")}
          rows={3}
          variant="badge"
          amount
        />
        <DashboardListCardSkeleton
          title={t("todo.label")}
          allLabel={t("manage")}
          onAll={() => navigate("/desk/todo")}
          rows={4}
          variant="dot"
        />
        <DashboardListCardSkeleton
          title={t("calendar.scheduled")}
          allLabel={t("calendar.title")}
          onAll={() => navigate("/desk/calendar")}
          rows={3}
          variant="badge"
        />
      </div>
    </div>
  );
}

function DashboardHeroSkeleton({
  mobile,
  year,
  month,
}: {
  mobile: boolean;
  year: number;
  month: number;
}) {
  // 정적 틀(eyebrow 라벨 + 자산/부채 라벨)은 실제 렌더, 금액(데이터)만 스켈레톤.
  const { t } = useTranslation("dashboard");
  return (
    <div
      className="balance-hero"
      style={mobile ? undefined : { padding: "28px 32px 24px" }}
    >
      <div
        className="balance-hero__eyebrow"
        style={{ display: "flex", alignItems: "center" }}
      >
        <Wallet size={mobile ? 13 : 14} />{" "}
        {mobile ? (
          t("asset.netAsset")
        ) : (
          <>
            {t("asset.netAsset")} · {formatYearMonth(new Date(year, month - 1))}
          </>
        )}
      </div>
      <div className="balance-hero__amount num">
        <SkeletonBase
          className={
            mobile
              ? "h-8 w-40 bg-static-white/15"
              : "h-10 w-56 bg-static-white/15"
          }
        />
      </div>
      <div className="balance-hero__sub">
        <SkeletonBase className="h-3 w-32 bg-static-white/15" />
      </div>
      <div className="balance-hero__split">
        <div>
          <div className="l">
            {mobile ? t("asset.assetTab") : t("asset.totalAsset")}
          </div>
          <SkeletonBase className="h-5 w-24 bg-static-white/15" />
        </div>
        <div>
          <div className="l">
            {mobile ? t("asset.debtTab") : t("asset.totalDebt")}
          </div>
          <SkeletonBase className="h-5 w-24 bg-static-white/15" />
        </div>
      </div>
    </div>
  );
}

function DashboardSummaryCardSkeleton({
  mobile,
  month,
  period,
  onPeriodChange,
}: {
  mobile: boolean;
  month: number;
  period: string;
  onPeriodChange: (v: string) => void;
}) {
  const { t } = useTranslation("dashboard");
  if (mobile) {
    // 모바일 월 가계부 — 카드 벗김(플랫 섹션): 헤드 + 본문(10px 인셋) + 헤어라인.
    return (
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
          {[t("chart.income"), t("chart.expense")].map((lbl) => (
            <div key={lbl}>
              <div
                style={{
                  fontSize: "var(--text-badge)",
                  color: "var(--fg-tertiary)",
                  fontWeight: "500",
                  marginBottom: 2,
                }}
              >
                {lbl}
              </div>
              <SkeletonBase className="h-6 w-24" />
            </div>
          ))}
        </div>
        <div
          style={{
            height: 1,
            background: "var(--border-subtle)",
            margin: "14px 10px",
          }}
        />
        <div>
          <SkeletonBase className="h-3 w-3/4" />
        </div>
      </div>
    );
  }
  // 데스크탑 수입·지출 카드 — 타이틀(정적) + MonthPicker(정적 선택기) + 3col 라벨(정적) + 금액·차트(데이터).
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{t("summary.monthIncomeExpense", { month })}</CardTitle>
        <MonthPicker value={period} onChange={onPeriodChange} />
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
          {[t("chart.income"), t("chart.expense"), t("balance")].map((lbl) => (
            <div key={lbl}>
              <div
                style={{
                  fontSize: "var(--text-caption)",
                  color: "var(--fg-tertiary)",
                  fontWeight: "500",
                  marginBottom: 4,
                }}
              >
                {lbl}
              </div>
              <SkeletonBase className="h-7 w-24" />
            </div>
          ))}
        </div>
        <SkeletonBase className="h-[280px] w-full" />
        <div
          style={{
            marginTop: 16,
            paddingTop: 14,
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <SkeletonBase className="h-3 w-3/4" />
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardCategoryCardSkeleton({
  mobile,
  onDetail,
}: {
  mobile: boolean;
  onDetail: () => void;
}) {
  // 타이틀 + '자세히' 링크(정적 틀)는 실제 렌더, 도넛+범례(데이터)만 스켈레톤.
  const { t } = useTranslation("dashboard");
  const body = (
    <div
      style={{
        display: "flex",
        flexDirection: mobile ? "row" : "column",
        alignItems: "center",
        gap: mobile ? 16 : 20,
      }}
    >
      <SkeletonBase
        className={
          mobile
            ? "h-[120px] w-[120px] rounded-full shrink-0"
            : "h-[160px] w-[160px] rounded-full shrink-0"
        }
      />
      <div
        style={{
          flex: 1,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <SkeletonBase className="h-2.5 w-2.5 rounded-full shrink-0" />
            <SkeletonBase className="h-3 flex-1" />
            <SkeletonBase className="h-3 w-12 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
  if (mobile) {
    // 카드 벗김(플랫 섹션) — 실제 렌더와 동일 구조.
    return (
      <div>
        <div className="sec-head">
          <h2>{t("categoryTitle")}</h2>
          <button className="all" onClick={onDetail}>
            {t("detail")} <ChevronRight size={14} />
          </button>
        </div>
        {body}
      </div>
    );
  }
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{t("categoryTitle")}</CardTitle>
        <Button variant="link" className="all h-auto p-0" onClick={onDetail}>
          {t("detail")} <ChevronRight size={14} />
        </Button>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}

function DashboardBudgetCardSkeleton({
  mobile,
  onManage,
}: {
  mobile: boolean;
  onManage: () => void;
}) {
  // 타이틀 + 링크(정적 틀)는 실제 렌더, 예산 항목(데이터)만 스켈레톤.
  const { t } = useTranslation("dashboard");
  const rows = (
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
            <SkeletonBase
              className={
                mobile
                  ? "h-10 w-10 rounded-md shrink-0"
                  : "h-8 w-8 rounded-md shrink-0"
              }
            />
            <SkeletonBase className="h-4 w-20" />
            <SkeletonBase className="h-4 w-24 ml-auto" />
          </div>
          <SkeletonBase className="h-1.5 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
  if (mobile) {
    // 카드 벗김(플랫 섹션) — 실제 렌더와 동일 구조.
    return (
      <div>
        <div className="sec-head" style={{ marginBottom: 14 }}>
          <h2>{t("expense.budget")}</h2>
          <button className="all" onClick={onManage}>
            {t("all")} <ChevronRight size={14} />
          </button>
        </div>
        {rows}
      </div>
    );
  }
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{t("expense.budget")}</CardTitle>
        <Button variant="link" className="all h-auto p-0" onClick={onManage}>
          {t("manageBudget")} <ChevronRight size={14} />
        </Button>
      </CardHeader>
      <CardContent>{rows}</CardContent>
    </Card>
  );
}

/**
 * 리스트형 카드 스켈레톤 — 타이틀+링크(정적 틀)는 실제 렌더, 행(데이터)만 스켈레톤.
 * variant 로 로딩-후 실제 행 구조에 맞춤:
 *  - 'tx'    : ExpenseRow (chip 40 + 2줄 + 금액)            — 오늘 쓴 돈
 *  - 'badge' : D-뱃지 38 + title/date + (금액)              — 예정된 결제 / 예정된 일정
 *  - 'dot'   : 6px 점 + title + date (박스·금액 없음)        — 할 일
 */
function DashboardListCardSkeleton({
  title,
  allLabel,
  onAll,
  rows = 3,
  variant,
  amount = false,
  mobile = false,
}: {
  title: string;
  allLabel?: string;
  onAll?: () => void;
  rows?: number;
  variant: "tx" | "badge" | "dot";
  amount?: boolean;
  mobile?: boolean;
}) {
  const body = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: variant === "dot" ? 14 : 12,
      }}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: variant === "dot" ? 10 : variant === "tx" ? 12 : 10,
          }}
        >
          {variant === "dot" ? (
            <SkeletonBase className="h-1.5 w-1.5 rounded-full shrink-0" />
          ) : (
            <SkeletonBase
              className={
                variant === "tx"
                  ? "h-10 w-10 rounded-md shrink-0"
                  : "h-[38px] w-[38px] rounded-md shrink-0"
              }
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <SkeletonBase
              className={variant === "dot" ? "h-4 w-1/2" : "h-4 w-1/2 mb-1.5"}
            />
            {variant !== "dot" && <SkeletonBase className="h-3 w-1/3" />}
          </div>
          {(amount || variant === "dot") && (
            <SkeletonBase
              className={
                variant === "dot" ? "h-3 w-10 shrink-0" : "h-4 w-16 shrink-0"
              }
            />
          )}
        </div>
      ))}
    </div>
  );
  if (mobile) {
    // 카드 벗김(플랫 섹션) — 실제 렌더와 동일 구조.
    return (
      <div>
        <div className="sec-head" style={{ marginBottom: 6 }}>
          <h2>{title}</h2>
          {allLabel && (
            <button className="all" onClick={onAll}>
              {allLabel}
            </button>
          )}
        </div>
        {body}
      </div>
    );
  }
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {allLabel && (
          <Button variant="link" className="all h-auto p-0" onClick={onAll}>
            {allLabel} <ChevronRight size={14} />
          </Button>
        )}
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}

/**
 * 모바일 홈 위젯 섹션 스켈레톤 — WidgetHead(아이콘+타이틀+chevron)는 실제 렌더,
 * widget-row(padding 10px 0 · gap 12)만 데이터 placeholder. HomeUpcomingSection/HomeTodosSection 미러.
 *  - 'dot'   : 8px 점 + title + D-day       — 다가오는 일정
 *  - 'check' : 18px 체크써클 + title + date  — 최근 할 일
 */
function DashboardWidgetSectionSkeleton({
  icon,
  title,
  onAll,
  marker,
  rows = 3,
}: {
  icon: React.ReactNode;
  title: string;
  onAll: () => void;
  marker: "dot" | "check";
  rows?: number;
}) {
  return (
    <div>
      <WidgetHead icon={icon} title={title} onAll={onAll} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 0",
            }}
          >
            <SkeletonBase
              className={
                marker === "dot"
                  ? "h-2 w-2 rounded-full shrink-0"
                  : "h-[18px] w-[18px] rounded-full shrink-0"
              }
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <SkeletonBase className="h-4 w-1/2" />
            </div>
            <SkeletonBase className="h-3 w-10 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
