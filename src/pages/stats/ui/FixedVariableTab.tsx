import { useState, type CSSProperties, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Pin } from "lucide-react";
import { KRW, formatChartAxis } from "@/shared/lib/groo/format";
import { MaskAmount, WonUnit } from "@/shared/lib/groo/hide-amounts";
import { wonPre } from "@/shared/lib/groo/hide-amounts-core";
import { niceCeil } from "@/shared/lib/groo/chartAxis";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/shared/ui/chart";
import { Section } from "@/shared/ui/groo/section";
import { Skeleton } from "@/shared/ui/skeleton";
import { Button } from "@/shared/ui/button";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@/shared/ds/segmented-control";
import { splitFixed, type FixedSplit } from "@/entities/expense";
import type {
  CategoryBreakdown,
  ExpenseCategory,
  MonthlyTrend,
  RangeSummary,
} from "@/entities/expense";
import { useMonthlyTrend } from "@/features/expense";

/*
 * 통계 · 고정/변동 탭 — 한 기간의 수입·지출을 **고정**과 **변동(고정 제외)** 으로 나눠 보여 준다.
 *
 * 서버가 내리는 건 전체와 그 가운데 고정인 몫뿐이다. 변동은 `전체 − 고정` 으로 이 화면이 구한다
 * (`splitFixed`). 세 숫자가 늘 맞아떨어지고, 환불·미래분 규칙이 서버 한 곳에만 있게 하려는 것이다.
 *
 * 색만으로 가르지 않는다 — 고정은 **꽉 찬 색**, 변동은 **옅은 바탕 + 같은 색 1px 테두리**이고,
 * 막대 옆에는 늘 이름과 숫자가 붙는다. 색을 못 보는 사용자도 둘을 구별해야 한다.
 */

type Kind = "expense" | "income";

/** 종류별 색 — 고정은 진한 색, 변동은 옅은 색(같은 색 + 테두리). */
const KIND_COLOR: Record<Kind, string> = {
  expense: "var(--fg-expense)",
  income: "var(--status-info-fg)",
};
const variableFill = (kind: Kind) =>
  `color-mix(in srgb, ${KIND_COLOR[kind]} 22%, var(--bg-surface))`;

/** 금액 + 단위 — 숨기기 설정을 따른다(카드 키는 바깥 HideCard 가 정한다). */
function Amount({ value }: { value: number }) {
  return (
    <>
      <MaskAmount>
        {wonPre()}
        {KRW(value)}
      </MaskAmount>
      <WonUnit />
    </>
  );
}

/** 고정(꽉 찬 색) / 변동(옅은 바탕 + 테두리) 견본 — 범례와 숫자 줄이 같은 모양을 쓴다. */
function Swatch({ kind, fixed }: { kind: Kind; fixed: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 10,
        height: 10,
        borderRadius: "var(--radius-xs)",
        background: fixed ? KIND_COLOR[kind] : variableFill(kind),
        border: `1px solid ${KIND_COLOR[kind]}`,
        boxSizing: "border-box",
        flexShrink: 0,
        display: "inline-block",
      }}
    />
  );
}

/**
 * 한 줄 비율 막대 — 왼쪽이 고정, 오른쪽이 변동. 폭은 전체에 대한 비율이다.
 * 전체가 0 이면 빈 트랙만 그린다(0 으로 나누지 않는다).
 */
function RatioBar({
  kind,
  split,
  ariaLabel,
}: {
  kind: Kind;
  split: FixedSplit;
  ariaLabel: string;
}) {
  const fixedPct = split.total === 0 ? 0 : (split.fixed / split.total) * 100;
  const common: CSSProperties = {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "var(--text-caption)",
    fontWeight: 700,
    overflow: "hidden",
    whiteSpace: "nowrap",
    boxSizing: "border-box",
  };
  return (
    <div
      role="img"
      aria-label={ariaLabel}
      style={{
        display: "flex",
        height: 28,
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        background: "var(--bg-sunken)",
      }}
    >
      {split.fixed > 0 && (
        <div
          style={{
            ...common,
            width: `${fixedPct}%`,
            background: KIND_COLOR[kind],
            color: "var(--bg-surface)",
          }}
        >
          {fixedPct >= 14 ? `${split.fixedPercent}%` : ""}
        </div>
      )}
      {split.variable > 0 && (
        <div
          style={{
            ...common,
            flex: 1,
            background: variableFill(kind),
            color: KIND_COLOR[kind],
            border: `1px solid ${KIND_COLOR[kind]}`,
          }}
        >
          {100 - fixedPct >= 14 ? `${100 - split.fixedPercent}%` : ""}
        </div>
      )}
    </div>
  );
}

/** 숫자 한 칸 — 이름 위, 금액 아래. 견본이 있으면 이름 앞에 붙는다. */
function Figure({
  label,
  value,
  swatch,
  sub,
}: {
  label: string;
  value: number;
  swatch?: ReactNode;
  sub?: string;
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: "var(--text-caption)",
          color: "var(--fg-secondary)",
        }}
      >
        {swatch}
        <span>{label}</span>
      </div>
      <div
        className="num"
        style={{
          marginTop: 2,
          fontSize: "var(--text-body-lg)",
          fontWeight: 700,
          color: "var(--fg-primary)",
          overflowWrap: "anywhere",
        }}
      >
        <Amount value={value} />
      </div>
      {sub && (
        <div
          style={{
            fontSize: "var(--text-caption)",
            color: "var(--fg-tertiary)",
            marginTop: 1,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

/** 지출 또는 수입 한 종류의 개요 — 비율 막대 + 전체·고정·고정 제외 숫자 + 한 줄 해설. */
function Overview({
  kind,
  split,
  mobile,
  action,
  onManage,
}: {
  kind: Kind;
  split: FixedSplit;
  mobile: boolean;
  action?: ReactNode;
  onManage: () => void;
}) {
  const { t } = useTranslation("stats");
  const noFixed = split.total > 0 && split.fixed === 0;
  return (
    <Section mobile={mobile} title={t(`fixed.${kind}.title`)} action={action}>
      {split.total === 0 ? (
        <div
          style={{
            padding: "24px 0",
            textAlign: "center",
            color: "var(--fg-tertiary)",
            fontSize: "var(--text-label-sm)",
          }}
        >
          {t(`fixed.${kind}.none`)}
        </div>
      ) : (
        <>
          <RatioBar
            kind={kind}
            split={split}
            ariaLabel={t("fixed.bar.aria", {
              kind: t(`fixed.total.${kind}`),
              fixed: split.fixedPercent,
              variable: 100 - split.fixedPercent,
            })}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(3, 1fr)",
              gap: mobile ? "14px 12px" : 16,
              marginTop: 16,
            }}
          >
            <div style={mobile ? { gridColumn: "1 / -1" } : undefined}>
              <Figure label={t(`fixed.total.${kind}`)} value={split.total} />
            </div>
            <Figure
              label={t(`fixed.fixed.${kind}`)}
              value={split.fixed}
              swatch={<Swatch kind={kind} fixed />}
              sub={`${split.fixedPercent}%`}
            />
            <Figure
              label={t(`fixed.variable.${kind}`)}
              value={split.variable}
              swatch={<Swatch kind={kind} fixed={false} />}
              sub={`${100 - split.fixedPercent}%`}
            />
          </div>
          {noFixed ? (
            <div
              style={{
                marginTop: 16,
                padding: "12px 14px",
                borderRadius: "var(--radius-tile)",
                background: "var(--bg-sunken)",
                fontSize: "var(--text-label-sm)",
                color: "var(--fg-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <span style={{ minWidth: 0 }}>{t("fixed.empty.desc")}</span>
              <Button variant="outline" size="sm" onClick={onManage}>
                {t("fixed.manage")}
              </Button>
            </div>
          ) : (
            <p
              style={{
                margin: "16px 0 0",
                fontSize: "var(--text-label-sm)",
                color: "var(--fg-secondary)",
              }}
            >
              {t(`fixed.insight.${kind}`, { pct: split.fixedPercent })}{" "}
              <strong style={{ color: "var(--fg-primary)" }}>
                <Amount value={split.variable} />
              </strong>
              {t("fixed.insight.tail")}
            </p>
          )}
        </>
      )}
    </Section>
  );
}

interface MonthRow {
  label: string;
  fixed: number;
  variable: number;
}

/** 월 라벨 — 한 해 안이면 'MM', 해가 섞이면 'YYYY.MM'. 추이 탭과 같은 규칙. */
function monthLabels(rows: { year: number; month: number }[]): string[] {
  const sameYear = rows.every((r) => r.year === rows[0]!.year);
  return rows.map((r) =>
    sameYear
      ? String(r.month).padStart(2, "0")
      : `${r.year}.${String(r.month).padStart(2, "0")}`,
  );
}

function toRows(
  src: {
    year: number;
    month: number;
    total: number;
    fixed?: number;
  }[],
): MonthRow[] {
  const labels = monthLabels(src);
  return src.map((r, i) => {
    const s = splitFixed(r.total, r.fixed);
    return { label: labels[i]!, fixed: s.fixed, variable: s.variable };
  });
}

function FixedTooltip({
  active,
  payload,
  label,
  kind,
}: {
  active?: boolean;
  payload?: { dataKey?: string | number; value?: number }[];
  label?: string;
  kind: Kind;
}) {
  const { t } = useTranslation("stats");
  if (!active || !payload || payload.length === 0) return null;
  const val = (key: string) =>
    Number(payload.find((p) => p.dataKey === key)?.value ?? 0);
  const fixed = val("fixed");
  const variable = val("variable");
  const row = (text: string, v: number, isFixed: boolean) => (
    <div
      style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}
    >
      <Swatch kind={kind} fixed={isFixed} />
      <span style={{ color: "var(--fg-secondary)" }}>{text}</span>
      <span
        className="num"
        style={{
          marginLeft: "auto",
          fontWeight: 700,
          color: "var(--fg-primary)",
        }}
      >
        <Amount value={v} />
      </span>
    </div>
  );
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-tile)",
        boxShadow: "var(--shadow-md)",
        padding: "10px 12px",
        fontSize: "var(--text-caption)",
        minWidth: 170,
      }}
    >
      <div
        style={{
          color: "var(--fg-tertiary)",
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {row(t("fixed.legend.fixed"), fixed, true)}
      {row(t("fixed.legend.variable"), variable, false)}
      <div
        style={{
          display: "flex",
          marginTop: 6,
          paddingTop: 6,
          borderTop: "1px solid var(--border-subtle)",
          color: "var(--fg-secondary)",
        }}
      >
        <span>{t(`fixed.total.${kind}`)}</span>
        <span
          className="num"
          style={{
            marginLeft: "auto",
            fontWeight: 700,
            color: "var(--fg-primary)",
          }}
        >
          <Amount value={fixed + variable} />
        </span>
      </div>
    </div>
  );
}

/** 월별 누적 막대 — 아래가 고정(꽉 찬 색), 위가 변동(옅은 색). 달마다 고정이 얼마나 일정한지 한눈에 보인다. */
function MonthlyStack({
  mobile,
  rows,
  kind,
}: {
  mobile: boolean;
  rows: MonthRow[];
  kind: Kind;
}) {
  const { t } = useTranslation("stats");
  const config: ChartConfig = {
    fixed: { label: t("fixed.legend.fixed"), color: KIND_COLOR[kind] },
    variable: { label: t("fixed.legend.variable"), color: KIND_COLOR[kind] },
  };
  const axis = niceCeil(Math.max(0, ...rows.map((r) => r.fixed + r.variable)));
  return (
    <>
      <ChartContainer
        config={config}
        className="aspect-auto w-full"
        style={{ height: mobile ? 200 : 260 }}
      >
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
            interval="preserveStartEnd"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            domain={[0, axis.max]}
            ticks={axis.ticks}
            tick={{ fontSize: "var(--text-badge)", fill: "var(--fg-tertiary)" }}
            tickFormatter={formatChartAxis}
            width={52}
          />
          <ChartTooltip
            cursor={{ fill: "var(--bg-sunken)" }}
            content={<FixedTooltip kind={kind} />}
          />
          <Bar
            dataKey="fixed"
            stackId="a"
            fill={KIND_COLOR[kind]}
            maxBarSize={36}
          />
          <Bar
            dataKey="variable"
            stackId="a"
            fill={variableFill(kind)}
            stroke={KIND_COLOR[kind]}
            strokeWidth={1}
            radius={[4, 4, 0, 0]}
            maxBarSize={36}
          />
        </BarChart>
      </ChartContainer>
      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 12,
          fontSize: "var(--text-caption)",
          color: "var(--fg-secondary)",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Swatch kind={kind} fixed />
          {t("fixed.legend.fixed")}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Swatch kind={kind} fixed={false} />
          {t("fixed.legend.variable")}
        </span>
      </div>
    </>
  );
}

interface CategoryRow {
  key: string;
  name: string;
  color: string | null;
  total: number;
  fixed: number;
}

/** 지출 카테고리를 부모 단위로 묶어 고정·변동 몫을 합친다 — 도넛과 같은 묶음 규칙. */
function categoryRows(
  breakdown: CategoryBreakdown[],
  categoryById: Map<number, ExpenseCategory>,
  uncategorized: string,
): CategoryRow[] {
  const map = new Map<string, CategoryRow>();
  for (const c of breakdown) {
    if (c.expenseType !== "EXPENSE") continue;
    const groupId = c.parentCategoryRowId ?? c.categoryRowId;
    const key = groupId == null ? "none" : String(groupId);
    let row = map.get(key);
    if (!row) {
      row = {
        key,
        name: c.parentCategoryName ?? c.categoryName ?? uncategorized,
        color:
          groupId != null ? (categoryById.get(groupId)?.color ?? null) : null,
        total: 0,
        fixed: 0,
      };
      map.set(key, row);
    }
    const s = splitFixed(c.totalAmount, c.fixedAmount);
    row.total += s.total;
    row.fixed += s.fixed;
  }
  return [...map.values()]
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total);
}

const CATEGORY_LIMIT = 8;

function CategoryBars({
  mobile,
  rows,
}: {
  mobile: boolean;
  rows: CategoryRow[];
}) {
  const { t } = useTranslation("stats");
  const shown = rows.slice(0, CATEGORY_LIMIT);
  const max = Math.max(1, ...shown.map((r) => r.total));
  return (
    <ul
      style={{
        listStyle: "none",
        margin: 0,
        padding: 0,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {shown.map((r) => {
        const s = splitFixed(r.total, r.fixed);
        return (
          <li key={r.key}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  minWidth: 0,
                  fontSize: "var(--text-label-sm)",
                  fontWeight: 600,
                  color: "var(--fg-primary)",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: r.color ?? "var(--fg-tertiary)",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.name}
                </span>
              </span>
              <span
                className="num"
                style={{
                  fontSize: "var(--text-label-sm)",
                  fontWeight: 700,
                  color: "var(--fg-primary)",
                  flexShrink: 0,
                }}
              >
                <Amount value={s.total} />
              </span>
            </div>
            <div
              style={{
                display: "flex",
                height: 10,
                marginTop: 6,
                borderRadius: "var(--radius-xs)",
                overflow: "hidden",
                background: "var(--bg-sunken)",
              }}
            >
              <div
                style={{ display: "flex", width: `${(s.total / max) * 100}%` }}
              >
                {s.fixed > 0 && (
                  <div
                    style={{
                      width: `${(s.fixed / s.total) * 100}%`,
                      background: KIND_COLOR.expense,
                    }}
                  />
                )}
                {s.variable > 0 && (
                  <div
                    style={{
                      flex: 1,
                      background: variableFill("expense"),
                      border: `1px solid ${KIND_COLOR.expense}`,
                      boxSizing: "border-box",
                    }}
                  />
                )}
              </div>
            </div>
            {s.fixed > 0 && (
              <div
                style={{
                  marginTop: 4,
                  fontSize: "var(--text-caption)",
                  color: "var(--fg-tertiary)",
                }}
              >
                {t("fixed.category.fixedPart", { pct: s.fixedPercent })}
                {mobile ? "" : " · "}
                {!mobile && <Amount value={s.fixed} />}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export interface FixedVariableTabProps {
  mobile: boolean;
  loading: boolean;
  summary: RangeSummary | undefined;
  categoryById: Map<number, ExpenseCategory>;
  /** 기간 고르기 버튼 — 다른 탭과 같은 자리(첫 섹션의 action)에 둔다. */
  periodAction: ReactNode;
  /** 거래를 고정으로 정리하는 대화상자를 연다. */
  onManage: () => void;
}

export function FixedVariableTab({
  mobile,
  loading,
  summary,
  categoryById,
  periodAction,
  onManage,
}: FixedVariableTabProps) {
  const { t } = useTranslation("stats");
  const [chartKind, setChartKind] = useState<Kind>("expense");
  // 한 달만 고른 기간이면 막대가 하나뿐이라 의미가 없다 — 그때는 최근 6개월을 보여 준다.
  const trendQ = useMonthlyTrend(6);

  if (loading || !summary) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Skeleton className="w-full rounded-lg" style={{ height: 200 }} />
        <Skeleton className="w-full rounded-lg" style={{ height: 240 }} />
      </div>
    );
  }

  const expenseSplit = splitFixed(summary.totalExpense, summary.fixedExpense);
  const incomeSplit = splitFixed(summary.totalIncome, summary.fixedIncome);

  const buckets = summary.monthlyBuckets;
  const useRange = buckets.length >= 2;
  const trend: MonthlyTrend[] = trendQ.data ?? [];
  const pick = (k: Kind) =>
    useRange
      ? toRows(
          buckets.map((b) => ({
            year: b.year,
            month: b.month,
            total: k === "expense" ? b.totalExpense : b.totalIncome,
            fixed: k === "expense" ? b.fixedExpense : b.fixedIncome,
          })),
        )
      : toRows(
          trend.map((m) => ({
            year: m.year,
            month: m.month,
            total: k === "expense" ? m.totalExpense : m.totalIncome,
            fixed: k === "expense" ? m.fixedExpense : m.fixedIncome,
          })),
        );
  const rows = pick(chartKind);
  const hasChart = rows.some((r) => r.fixed + r.variable > 0);

  const cats = categoryRows(
    summary.categoryBreakdown,
    categoryById,
    t("uncategorized"),
  );

  return (
    <div
      className={mobile ? "screen-bands" : undefined}
      style={
        mobile
          ? undefined
          : { display: "flex", flexDirection: "column", gap: 20 }
      }
    >
      <Overview
        kind="expense"
        split={expenseSplit}
        mobile={mobile}
        action={periodAction}
        onManage={onManage}
      />
      <Overview
        kind="income"
        split={incomeSplit}
        mobile={mobile}
        onManage={onManage}
      />

      <Section
        mobile={mobile}
        title={t("fixed.trend.title")}
        action={
          <SegmentedControl
            aria-label={t("fixed.trend.kindAria")}
            value={chartKind}
            onValueChange={(v) => setChartKind(v as Kind)}
            style={{ width: mobile ? 160 : 200 }}
          >
            <SegmentedControlItem value="expense">
              {t("fixed.kind.expense")}
            </SegmentedControlItem>
            <SegmentedControlItem value="income">
              {t("fixed.kind.income")}
            </SegmentedControlItem>
          </SegmentedControl>
        }
      >
        {!useRange && trendQ.isLoading ? (
          <Skeleton className="w-full rounded-lg" style={{ height: 200 }} />
        ) : !hasChart ? (
          <div
            style={{
              padding: "32px 0",
              textAlign: "center",
              color: "var(--fg-tertiary)",
              fontSize: "var(--text-label-sm)",
            }}
          >
            {t("empty.trend")}
          </div>
        ) : (
          <>
            {!useRange && (
              <div
                style={{
                  marginBottom: 8,
                  fontSize: "var(--text-caption)",
                  color: "var(--fg-tertiary)",
                }}
              >
                {t("fixed.trend.recent")}
              </div>
            )}
            <MonthlyStack mobile={mobile} rows={rows} kind={chartKind} />
          </>
        )}
      </Section>

      {cats.length > 0 && (
        <Section mobile={mobile} title={t("fixed.category.title")}>
          <CategoryBars mobile={mobile} rows={cats} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 18,
              paddingTop: 14,
              borderTop: "1px solid var(--border-subtle)",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: "var(--text-caption)",
                color: "var(--fg-tertiary)",
              }}
            >
              <Pin size={12} />
              {t("fixed.manageHint")}
            </span>
            <Button variant="outline" size="sm" onClick={onManage}>
              {t("fixed.manage")}
            </Button>
          </div>
        </Section>
      )}
    </div>
  );
}
