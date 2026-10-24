import { BandSurface, ScreenBands } from "@/shared/ui/groo/screen-bands";
import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
import { KRW, isEn } from "@/shared/lib/groo/format";
import { formatMonthShort } from "@/shared/lib/date";
import { HideUnit, MaskAmount, WonUnit } from "@/shared/lib/groo/hide-amounts";
import { wonPre } from "@/shared/lib/groo/hide-amounts-core";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/shared/ui/chart";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Section } from "@/shared/ui/groo/section";
import { Skeleton as SkeletonBase } from "@/shared/ui/skeleton";
import { Icon, MonthPicker } from "@/shared/ui/groo/primitives";
import { useBudgetModel } from "./budget-model";
import { getPaletteByColor } from "@/shared/lib/groo/chart-palette";
import { PageHead } from "@/shared/ui/groo/page-head";

type OutletCtx = { mobile: boolean };

type ComplianceTickProps = {
  x?: string | number;
  y?: string | number;
  payload?: { value?: string; index?: number };
};

// 마지막(이번 달) 레이블만 볼드 + primary 컬러.
function ComplianceMonthTick({ x, y, payload }: ComplianceTickProps) {
  const last = (payload?.index ?? 0) === 5;
  const yNum = typeof y === "number" ? y : Number(y ?? 0);
  return (
    <text
      x={x}
      y={yNum + 14}
      textAnchor="middle"
      style={{
        fontSize: "var(--text-badge)",
        fontWeight: last ? 700 : 500,
        fill: last ? "var(--fg-primary)" : "var(--fg-tertiary)",
      }}
    >
      {payload?.value}
    </text>
  );
}

type CompliancePayload = {
  payload?: {
    label?: string;
    percent?: number;
    limit?: number;
    spent?: number;
  };
};

function ComplianceTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: CompliancePayload[];
}) {
  const { t } = useTranslation("budget");
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const p = Number(d.percent ?? 0);
  const over = p > 100;
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-tile)",
        boxShadow: "var(--shadow-md)",
        padding: "8px 12px",
        fontSize: "var(--text-caption)",
        minWidth: 160,
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
        {d.label}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "var(--radius-xs)",
            background: over ? "var(--color-fg-critical)" : "var(--bg-brand)",
          }}
        />
        <span
          style={{
            fontSize: "var(--text-badge)",
            color: "var(--fg-secondary)",
          }}
        >
          {t("vsLimit")}
        </span>
        <span
          className="num"
          style={{
            marginLeft: "auto",
            fontSize: "var(--text-caption)",
            fontWeight: "700",
            color: over ? "var(--color-fg-critical)" : "var(--fg-primary)",
          }}
        >
          {p.toFixed(1)}%
        </span>
      </div>
      <div
        style={{
          marginTop: 6,
          paddingTop: 6,
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: "var(--text-badge)",
            color: "var(--fg-secondary)",
          }}
        >
          <span>{t("spent")}</span>
          <span
            className="num"
            style={{ marginLeft: "auto", fontWeight: "600" }}
          >
            <MaskAmount card="budget.compliance" mask="••••">
              {wonPre()}
              {Number(d.spent ?? 0).toLocaleString("ko-KR")}
            </MaskAmount>
            <WonUnit />
          </span>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "var(--text-badge)",
            color: "var(--fg-secondary)",
          }}
        >
          <span>{t("limit")}</span>
          <span
            className="num"
            style={{ marginLeft: "auto", fontWeight: "600" }}
          >
            <MaskAmount card="budget.compliance" mask="••••">
              {wonPre()}
              {Number(d.limit ?? 0).toLocaleString("ko-KR")}
            </MaskAmount>
            <WonUnit />
          </span>
        </div>
      </div>
    </div>
  );
}

/** Budget 페이지 구조에 맞춘 skeleton — HeaderCard + PaceCard + StatusTiles + ListCard + ComplianceCard. */
// 모바일 = 카드 다이어트(flat-group 헤드) / 데스크톱 = Card — 실렌더 Section 정합.
// (렌더 중 컴포넌트 생성 금지 — React Compiler 룰 — 로 모듈 레벨 정의.)
/**
 * 스켈레톤 섹션 껍데기 — 실렌더와 같은 `Section` SoT 를 그대로 쓴다.
 * 자체 Card/flat-group 복제본을 두면 Section 이 바뀔 때(예: headGap 신설) 로딩만
 * 옛 간격에 남아 데이터가 오는 순간 헤드↔리스트가 튄다.
 */
function SkelSection({
  mobile,
  head,
  headGap,
  children,
}: {
  mobile: boolean;
  head: React.ReactNode;
  headGap?: number;
  children: React.ReactNode;
}) {
  return (
    <Section mobile={mobile} title={head} headGap={headGap}>
      {children}
    </Section>
  );
}

function BudgetPageSkeleton({ mobile }: { mobile: boolean }) {
  const { t } = useTranslation("budget");
  const HeaderCardSkeleton = (
    <BandSurface mobile={mobile}>
      <SkeletonBase className="h-3 w-24 mb-2" />
      <SkeletonBase className="h-3 w-3/4 mb-3" />
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 6,
          marginBottom: 12,
        }}
      >
        <SkeletonBase className={mobile ? "h-7 w-32" : "h-9 w-40"} />
        <SkeletonBase className="h-4 w-28" />
      </div>
      <SkeletonBase className="h-2.5 w-full rounded-full" />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 8,
        }}
      >
        <SkeletonBase className="h-3 w-16" />
        <SkeletonBase className="h-3 w-24" />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          paddingTop: 14,
          marginTop: 14,
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <SkeletonBase className="h-3 w-16 mb-2" />
            <SkeletonBase className="h-4 w-20" />
          </div>
        ))}
      </div>
    </BandSurface>
  );

  const PaceCardSkeleton = (
    <SkelSection
      mobile={mobile}
      head={
        <>
          <SkeletonBase className="h-5 w-24" />
          <SkeletonBase className="h-6 w-16 rounded-full ml-auto" />
        </>
      }
    >
      <SkeletonBase className="h-3 w-full rounded-full mb-3" />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <SkeletonBase className="h-3 w-16" />
        <SkeletonBase className="h-3 w-24" />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          paddingTop: 16,
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        {[0, 1].map((i) => (
          <div key={i}>
            <SkeletonBase className="h-3 w-20 mb-2" />
            <SkeletonBase className="h-6 w-28" />
          </div>
        ))}
      </div>
    </SkelSection>
  );

  const StatusTilesSkeleton = (
    <SkelSection mobile={mobile} head={<SkeletonBase className="h-5 w-20" />}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[0, 1].map((i) => (
          <div
            key={i}
            style={{
              padding: 12,
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <SkeletonBase className="h-3 w-10 mb-2" />
            <SkeletonBase className="h-7 w-16" />
          </div>
        ))}
      </div>
    </SkelSection>
  );

  const ListCardSkeleton = (
    <SkelSection
      mobile={mobile}
      // 실렌더 Section 과 같은 헤드↔리스트 간격(홈 예산 정합).
      headGap={28}
      head={
        <>
          <SkeletonBase className="h-5 w-28" />
          <SkeletonBase className="h-3 w-16 ml-auto" />
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 8,
              }}
            >
              <SkeletonBase className="h-9 w-9 rounded-lg shrink-0" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <SkeletonBase className="h-4 w-1/2 mb-1.5" />
                <SkeletonBase className="h-3 w-1/3" />
              </div>
              <div style={{ textAlign: "right", minWidth: 90 }}>
                <SkeletonBase className="h-4 w-20 mb-1 ml-auto" />
                <SkeletonBase className="h-3 w-16 ml-auto" />
              </div>
            </div>
            <SkeletonBase className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </SkelSection>
  );

  const ComplianceCardSkeleton = (
    <SkelSection
      mobile={mobile}
      head={
        <>
          <SkeletonBase className="h-5 w-44" />
          <SkeletonBase className="h-3 w-24 ml-auto" />
        </>
      }
    >
      <div
        style={{
          height: 180,
          display: "flex",
          alignItems: "flex-end",
          gap: 12,
          paddingTop: 24,
        }}
      >
        {[0.6, 0.8, 0.5, 0.9, 0.7, 1.0].map((h, i) => (
          <SkeletonBase
            key={i}
            className="flex-1 rounded-t"
            style={{ height: `${h * 80}%` }}
          />
        ))}
      </div>
    </SkelSection>
  );

  if (mobile) {
    return (
      // 폰 구역 화면 — 기간 고르기 · 요약 · 구역마다 화면 폭 흰 띠(I-01 결정 3, 실렌더와 같은 구조)
      <ScreenBands>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <SkeletonBase className="h-8 w-32" />
          <SkeletonBase className="h-8 w-24" />
        </div>
        <>
          {HeaderCardSkeleton}
          {PaceCardSkeleton}
          {StatusTilesSkeleton}
          {ListCardSkeleton}
          {ComplianceCardSkeleton}
        </>
      </ScreenBands>
    );
  }

  return (
    <div className="page">
      <PageHead title={t("pageTitle")} description={t("subtitle")} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.5fr",
          gap: 20,
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {HeaderCardSkeleton}
          {PaceCardSkeleton}
          {StatusTilesSkeleton}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {ListCardSkeleton}
          {ComplianceCardSkeleton}
        </div>
      </div>
    </div>
  );
}

export const BudgetPage = () => {
  const { mobile } = useOutletContext<OutletCtx>();
  const { t } = useTranslation("budget");
  const navigate = useNavigate();
  const {
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
  } = useBudgetModel();

  // 첫 진입 시 모든 데이터 도착 전까지 한 번만 skeleton — 이후 monthKey 변경은 부분 로딩.
  const pageDataLoading =
    budgetsQ.isLoading ||
    summaryQ.isLoading ||
    categoriesQ.isLoading ||
    complianceQ.isLoading ||
    preferencesQ.isLoading;
  const [hasEverLoaded, setHasEverLoaded] = useState(false);
  // 데이터가 모두 도착하면 hasEverLoaded 를 true 로 — render 중에 동기 set (React 권장 패턴).
  if (!pageDataLoading && !hasEverLoaded) setHasEverLoaded(true);
  const shouldShowSkeleton = pageDataLoading && !hasEverLoaded;

  const goToSettings = () => navigate("/desk/settings?section=budget");

  const headerState = pct > 100 ? "over" : pct > warnThreshold ? "warn" : "";
  const isLoading = budgetsQ.isLoading || summaryQ.isLoading;

  // ---- Cards ----
  const HeaderCard = (
    // 가계부 취합 카드 정합(사용자 결정) — raised(surface-raised + shadow-lg) 히어로.
    <BandSurface mobile={mobile} variant="raised">
      <div
        style={{
          fontSize: "var(--text-caption)",
          color: "var(--fg-brand-strong)",
          fontWeight: "600",
          letterSpacing: "0.04em",
          marginBottom: 2,
        }}
      >
        {t("monthlyCap", { month })}
      </div>
      <div
        style={{
          fontSize: "var(--text-caption)",
          color: "var(--fg-tertiary)",
          lineHeight: "1.5",
          marginBottom: 10,
        }}
      >
        {t("capHint")}
      </div>
      {overallBudget ? (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 6,
              marginBottom: 12,
            }}
          >
            <div
              className="num"
              style={{
                fontSize: mobile ? 24 : 30,
                fontWeight: "800",
                letterSpacing: "-0.022em",
              }}
            >
              <MaskAmount card="budget.header" mask="••••">
                {wonPre()}
                {KRW(totalSpent)}
              </MaskAmount>
            </div>
            <div
              style={{
                fontSize: "var(--text-body-sm)",
                color: "var(--fg-secondary)",
                fontWeight: "500",
              }}
            >
              /{" "}
              <MaskAmount card="budget.header" mask="••••">
                {wonPre()}
                {KRW(totalLimit)}
              </MaskAmount>
              <WonUnit card="budget.header" />
            </div>
          </div>
          <div className="budget-bar" style={{ height: 10 }}>
            <div
              className={`budget-bar__fill ${headerState}`}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "var(--text-caption)",
              color: "var(--fg-secondary)",
              marginTop: 8,
            }}
          >
            <span>
              {pct.toFixed(0)}% {t("manager.spent")}
            </span>
            <span
              style={{
                color:
                  totalLimit - totalSpent < 0
                    ? "var(--color-fg-critical)"
                    : undefined,
              }}
            >
              {totalLimit - totalSpent >= 0 ? (
                <>
                  {t("manager.remaining")}{" "}
                  <MaskAmount card="budget.header" mask="••••">
                    {wonPre()}
                    {KRW(totalLimit - totalSpent)}
                  </MaskAmount>
                  <WonUnit card="budget.header" />
                </>
              ) : (
                <>
                  {t("limit")}{" "}
                  <MaskAmount card="budget.header" mask="••••">
                    {wonPre()}
                    {KRW(totalSpent - totalLimit)}
                  </MaskAmount>
                  <WonUnit card="budget.header" /> {t("over")}
                </>
              )}
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
              paddingTop: 14,
              marginTop: 14,
              borderTop:
                "1px solid color-mix(in srgb, var(--border-strong) 28%, var(--border-subtle))",
            }}
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
                {t("totalCap")}
              </div>
              <div
                className="num"
                style={{ fontSize: "var(--text-body-sm)", fontWeight: "700" }}
              >
                <MaskAmount card="budget.header" mask="••••">
                  {wonPre()}
                  {KRW(overallLimit)}
                </MaskAmount>
                <WonUnit card="budget.header" />
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
                {t("categoryAllocated")}
              </div>
              <div
                className="num"
                style={{ fontSize: "var(--text-body-sm)", fontWeight: "700" }}
              >
                <MaskAmount card="budget.header" mask="••••">
                  {wonPre()}
                  {KRW(categoryLimitSum)}
                </MaskAmount>
                <WonUnit card="budget.header" />
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
                {t("manager.assignable")}
              </div>
              <div
                className="num"
                style={{
                  fontSize: "var(--text-body-sm)",
                  fontWeight: "700",
                  color: overAllocated
                    ? "var(--color-fg-critical)"
                    : "var(--fg-income)",
                }}
              >
                <MaskAmount card="budget.header" mask="••••">
                  {overAllocated ? "−" : "+"}
                  {wonPre()}
                  {KRW(Math.abs(allocable))}
                </MaskAmount>
                <WonUnit card="budget.header" />
              </div>
            </div>
          </div>
          {overAllocated && (
            <div
              style={{
                marginTop: 10,
                padding: "8px 12px",
                background: "var(--status-danger-subtle)",
                border:
                  "1px solid color-mix(in oklch, var(--color-fg-critical) 30%, transparent)",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-caption)",
                color: "var(--status-danger-fg)",
                display: "flex",
                alignItems: "flex-start",
                gap: 6,
              }}
            >
              <AlertTriangle
                size={13}
                style={{ flexShrink: 0, marginTop: 1 }}
              />
              <span>
                {t("manager.overCapPre")}{" "}
                <MaskAmount card="budget.header" mask="••••">
                  {wonPre()}
                  {KRW(categoryLimitSum - overallLimit)}
                </MaskAmount>
                <WonUnit card="budget.header" /> {t("manager.overCapPost")}
              </span>
            </div>
          )}
        </>
      ) : (
        <div
          style={{
            padding: "14px 0 2px",
            fontSize: "var(--text-label-sm)",
            color: "var(--fg-secondary)",
            lineHeight: "1.7",
          }}
        >
          {t("capUnsetPre")} <strong>{t("manager.setBudget")}</strong>{" "}
          {t("capUnsetPost")}
          {categoryLimitSum > 0 && (
            <div
              style={{
                marginTop: 8,
                fontSize: "var(--text-caption)",
                color: "var(--fg-tertiary)",
              }}
            >
              {t("currentCategorySum")}:{" "}
              <MaskAmount card="budget.header" mask="••••">
                {wonPre()}
                {KRW(categoryLimitSum)}
              </MaskAmount>
              <WonUnit card="budget.header" />
            </div>
          )}
        </div>
      )}
    </BandSurface>
  );

  const PaceCard = (
    // 모바일 = 카드 다이어트(flat Section) / 데스크톱 = Card.
    <Section
      mobile={mobile}
      title={t("spendingPace")}
      action={
        <Badge
          variant={onTrack ? "success" : "warning"}
          // 색은 앱 정합 — 다크에서 -fg(light variant)·-subtle 로 (text-warning 고정 base 대신)
          className={
            onTrack
              ? "bg-[var(--status-success-subtle)] text-[var(--status-success-fg)]"
              : "bg-[var(--status-warning-subtle)] text-[var(--status-warning-fg)]"
          }
        >
          {onTrack ? t("paceNormal") : t("paceFast")}
        </Badge>
      }
    >
      <div
        style={{
          position: "relative",
          height: 12,
          background: "var(--color-bg-neutral-weak)",
          borderRadius: "var(--radius-pill)",
          overflow: "hidden",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${Math.min(100, pct)}%`,
            background:
              pct > 100 ? "var(--color-fg-critical)" : "var(--bg-brand)",
            borderRadius: "var(--radius-pill)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `${daysElapsedPct}%`,
            top: -3,
            width: 2,
            height: 18,
            background: "var(--fg-primary)",
            borderRadius: "var(--radius-xs)",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "var(--text-caption)",
          color: "var(--fg-tertiary)",
          marginBottom: 16,
        }}
      >
        <span>
          {pct.toFixed(0)}% {t("manager.spent")}
        </span>
        <span>{t("monthElapsed", { percent: daysElapsedPct.toFixed(0) })}</span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          paddingTop: 16,
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "var(--text-badge)",
              color: "var(--fg-tertiary)",
              fontWeight: "500",
              marginBottom: 4,
            }}
          >
            {t("dailyAvg")}
          </div>
          <div
            className="num"
            style={{
              fontSize: "var(--text-title-md)",
              fontWeight: "700",
              letterSpacing: "-0.022em",
            }}
          >
            <MaskAmount card="budget.pace" mask="••••">
              {wonPre()}
              {KRW(dailyActual)}
            </MaskAmount>
            {!isEn() && (
              <HideUnit>
                <span
                  style={{
                    fontSize: "var(--text-caption)",
                    fontWeight: "600",
                    color: "var(--fg-tertiary)",
                    marginLeft: 2,
                  }}
                >
                  원
                </span>
              </HideUnit>
            )}
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: "var(--text-badge)",
              color: "var(--fg-tertiary)",
              fontWeight: "500",
              marginBottom: 4,
            }}
          >
            {t("recommendedDaily")}
          </div>
          <div
            className="num"
            style={{
              fontSize: "var(--text-title-md)",
              fontWeight: "700",
              letterSpacing: "-0.022em",
              color: "var(--fg-brand-strong)",
            }}
          >
            <MaskAmount card="budget.pace" mask="••••">
              {wonPre()}
              {KRW(dailyTarget)}
            </MaskAmount>
            {!isEn() && (
              <HideUnit>
                <span
                  style={{
                    fontSize: "var(--text-caption)",
                    fontWeight: "600",
                    color: "var(--fg-tertiary)",
                    marginLeft: 2,
                  }}
                >
                  원
                </span>
              </HideUnit>
            )}
          </div>
        </div>
      </div>
    </Section>
  );

  const StatusTiles = (
    // 모바일 = 카드 다이어트(flat Section) — 내부 상태 타일(bordered 미니 타일)은 유지.
    <Section mobile={mobile} title={t("status")}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div
          style={{
            padding: 12,
            background:
              overList.length > 0
                ? "var(--status-danger-subtle)"
                : "var(--bg-surface)",
            border: `1px solid ${overList.length > 0 ? "color-mix(in oklch, var(--color-fg-critical) 30%, transparent)" : "var(--border-subtle)"}`,
            borderRadius: "var(--radius-lg)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: "var(--text-caption)",
              color:
                overList.length > 0
                  ? "var(--color-fg-critical)"
                  : "var(--fg-tertiary)",
              fontWeight: "600",
              marginBottom: 4,
            }}
          >
            <AlertTriangle size={13} /> {t("over")}
          </div>
          <div
            className="num"
            style={{
              fontSize: "var(--text-display-sm)",
              fontWeight: "700",
              letterSpacing: "-0.022em",
              color:
                overList.length > 0
                  ? "var(--color-fg-critical)"
                  : "var(--fg-primary)",
            }}
          >
            {overList.length}
            <span
              style={{
                fontSize: "var(--text-label-sm)",
                fontWeight: "600",
                color: "var(--fg-tertiary)",
                marginLeft: 4,
              }}
            >
              {t("edit.categoryLabel")}
            </span>
          </div>
        </div>
        <div
          style={{
            padding: 12,
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: "var(--text-caption)",
              color: "var(--fg-income)",
              fontWeight: "600",
              marginBottom: 4,
            }}
          >
            <CheckCircle2 size={13} /> {t("healthy")}
          </div>
          <div
            className="num"
            style={{
              fontSize: "var(--text-display-sm)",
              fontWeight: "700",
              letterSpacing: "-0.022em",
            }}
          >
            {healthyList.length}
            <span
              style={{
                fontSize: "var(--text-label-sm)",
                fontWeight: "600",
                color: "var(--fg-tertiary)",
                marginLeft: 4,
              }}
            >
              {t("edit.categoryLabel")}
            </span>
          </div>
        </div>
      </div>
    </Section>
  );

  const ComplianceCard = (() => {
    const rows = complianceQ.data ?? [];
    const complianceChartConfig = {
      percent: { label: t("complianceRate"), color: "var(--bg-brand)" },
    } satisfies ChartConfig;
    const data = rows.map((b) => ({
      label: formatMonthShort(b.month),
      percent: b.compliancePercent,
      limit: b.totalLimit,
      spent: b.totalSpent,
      year: b.year,
      month: b.month,
      active: b.year === year && b.month === month,
    }));
    return (
      // 모바일 = 카드 다이어트(flat Section) / 데스크톱 = Card.
      <Section
        mobile={mobile}
        title={t("complianceTitle")}
        action={
          <span
            style={{
              fontSize: "var(--text-caption)",
              color: "var(--fg-tertiary)",
            }}
          >
            {t("vsLimitSpending")}
          </span>
        }
      >
        {complianceQ.isLoading ? (
          <div
            style={{
              height: 180,
              display: "flex",
              alignItems: "end",
              justifyContent: "space-around",
              padding: "24px 8px 8px",
              gap: 12,
            }}
          >
            {[60, 80, 45, 70, 90, 55].map((h, i) => (
              <SkeletonBase
                key={i}
                className="rounded-t flex-1"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div
            style={{
              padding: "24px 0",
              textAlign: "center",
              color: "var(--fg-tertiary)",
              fontSize: "var(--text-caption)",
            }}
          >
            {t("noComplianceData")}
          </div>
        ) : (
          <ChartContainer
            config={complianceChartConfig}
            className="aspect-auto w-full"
            style={{ height: 180 }}
          >
            <BarChart
              data={data}
              margin={{ top: 24, right: 8, left: 8, bottom: 8 }}
              barCategoryGap="25%"
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
                tick={ComplianceMonthTick}
                tickMargin={6}
              />
              <YAxis hide domain={[0, (dmax: number) => Math.max(100, dmax)]} />
              <ChartTooltip
                cursor={{ fill: "var(--border-brand)", fillOpacity: 0.06 }}
                content={<ComplianceTooltip />}
              />
              <Bar dataKey="percent" radius={[6, 6, 0, 0]} isAnimationActive>
                {data.map((d) => (
                  <Cell
                    key={`${d.year}-${d.month}`}
                    fill={
                      d.percent > 100
                        ? "var(--color-fg-critical)"
                        : d.active
                          ? "var(--bg-brand)"
                          : "var(--border-strong)"
                    }
                  />
                ))}
                <LabelList
                  dataKey="percent"
                  position="top"
                  formatter={(v: unknown) => `${Math.round(Number(v ?? 0))}%`}
                  style={{
                    fontSize: "var(--text-badge)",
                    fontWeight: "700",
                    fill: "var(--fg-primary)",
                  }}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </Section>
    );
  })();

  const ListCard = (
    // 모바일 = 카드 다이어트(flat Section) / 데스크톱 = Card.
    <Section
      mobile={mobile}
      title={t("categoryBudgets")}
      // 홈 예산 섹션과 같은 간격 — 홈은 sec-head 14 위에 행 자체 상단 14 가 얹혀
      // 합 28 이다. 여기 행은 세로 패딩이 없어(행 사이 gap 18 뿐) 헤드가 28 을 다 쥔다.
      headGap={28}
      action={
        <span
          style={{
            fontSize: "var(--text-caption)",
            color: "var(--fg-tertiary)",
          }}
        >
          {t("countSet", { count: categoryBudgets.length })}
        </span>
      }
    >
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <SkeletonBase className="h-9 w-9 rounded-lg shrink-0" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <SkeletonBase className="h-4 w-1/2 mb-1.5" />
                  <SkeletonBase className="h-3 w-1/3" />
                </div>
                <div style={{ textAlign: "right", minWidth: 90 }}>
                  <SkeletonBase className="h-4 w-20 mb-1 ml-auto" />
                  <SkeletonBase className="h-3 w-16 ml-auto" />
                </div>
              </div>
              <SkeletonBase className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      ) : categoryBudgets.length === 0 ? (
        <div
          style={{
            padding: "32px 0",
            textAlign: "center",
            color: "var(--fg-tertiary)",
            fontSize: "var(--text-label-sm)",
          }}
        >
          <div>{t("noCategoryBudgets")}</div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            style={{ marginTop: 10, color: "var(--fg-brand-strong)" }}
            onClick={goToSettings}
          >
            {t("goSetBudget")}
          </Button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {categoryBudgets.map((b) => {
            const catId = b.categoryRowId as number;
            const cat = categoryMap.get(catId);
            const palette = getPaletteByColor(cat?.color);
            const name =
              cat?.categoryName ??
              b.categoryName ??
              t("manager.categoryFallback", { id: catId });
            const spent = spentByCategory.get(catId) ?? 0;
            const limit = b.budgetAmount;
            const p = limit > 0 ? (spent / limit) * 100 : 0;
            const state = p > 100 ? "over" : p > warnThreshold ? "warn" : "";

            return (
              <div key={b.rowId}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "var(--radius-tile)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontWeight: "700",
                      background: palette.bg,
                      color: palette.color,
                    }}
                  >
                    <Icon
                      name={cat?.icon ?? "tag"}
                      size={18}
                      strokeWidth={1.9}
                    />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "var(--text-body-sm)",
                        fontWeight: "600",
                      }}
                    >
                      {name}
                    </div>
                    <div
                      style={{
                        fontSize: "var(--text-caption)",
                        color:
                          state === "over"
                            ? "var(--color-fg-critical)"
                            : "var(--fg-tertiary)",
                        marginTop: 1,
                      }}
                    >
                      {state === "over" ? (
                        <>
                          {t("limit")}{" "}
                          <MaskAmount card="budget.categories" mask="••••">
                            {wonPre()}
                            {KRW(spent - limit)}
                          </MaskAmount>
                          <WonUnit card="budget.categories" /> {t("over")}
                        </>
                      ) : (
                        <>
                          {t("manager.remaining")}{" "}
                          <MaskAmount card="budget.categories" mask="••••">
                            {wonPre()}
                            {KRW(Math.max(0, limit - spent))}
                          </MaskAmount>
                          <WonUnit card="budget.categories" />
                        </>
                      )}
                    </div>
                  </div>
                  <div
                    className="num"
                    style={{ textAlign: "right", minWidth: 90 }}
                  >
                    <div
                      style={{
                        fontSize: "var(--text-body-sm)",
                        fontWeight: "700",
                        color:
                          state === "over"
                            ? "var(--color-fg-critical)"
                            : "var(--fg-primary)",
                      }}
                    >
                      <MaskAmount card="budget.categories" mask="••••">
                        {KRW(spent)}
                      </MaskAmount>
                    </div>
                    <div
                      style={{
                        fontSize: "var(--text-badge)",
                        color: "var(--fg-tertiary)",
                        fontWeight: "500",
                      }}
                    >
                      /{" "}
                      <MaskAmount card="budget.categories" mask="••••">
                        {KRW(limit)}
                      </MaskAmount>
                    </div>
                  </div>
                </div>
                <div className="budget-bar" style={{ height: 7 }}>
                  <div
                    className={`budget-bar__fill ${state}`}
                    style={{ width: `${Math.min(100, p)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );

  const PageControls = (
    <>
      <Button
        variant="ghost"
        size="icon"
        type="button"
        aria-label={t("prevMonth")}
        onClick={() => adjustMonth(-1)}
      >
        <ChevronLeft size={16} />
      </Button>
      <MonthPicker
        value={monthKey}
        onChange={setMonthKey}
        variant="borderless"
        allowFuture
      />
      <Button
        variant="ghost"
        size="icon"
        type="button"
        aria-label={t("nextMonth")}
        onClick={() => adjustMonth(1)}
      >
        <ChevronRight size={16} />
      </Button>
      <Button
        variant="accent"
        size="sm"
        type="button"
        onClick={goToSettings}
        style={{ marginLeft: "auto" }}
      >
        <Settings size={14} /> {t("settings")}
      </Button>
    </>
  );

  if (shouldShowSkeleton) return <BudgetPageSkeleton mobile={mobile} />;

  if (mobile) {
    return (
      // 폰 구역 화면 — 기간 고르기 · 요약 · 구역마다 화면 폭 흰 띠, 사이 8(I-01 결정 3)
      <ScreenBands>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          {PageControls}
        </div>
        <>
          {HeaderCard}
          {PaceCard}
          {StatusTiles}
          {ListCard}
          {ComplianceCard}
        </>
      </ScreenBands>
    );
  }

  return (
    <div className="page">
      <PageHead
        title={t("pageTitle")}
        description={t("subtitle")}
        actions={<>{PageControls}</>}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.5fr",
          gap: 20,
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {HeaderCard}
          {PaceCard}
          {StatusTiles}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {ListCard}
          {ComplianceCard}
        </div>
      </div>
    </div>
  );
};
