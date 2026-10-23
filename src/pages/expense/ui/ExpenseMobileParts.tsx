import type { ReactNode } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { withCommaBreaks } from "@/shared/ds/i18n";
import { Button } from "@/shared/ds/button";
import { ChartTooltipContent } from "@/shared/ds/chart";
import { ChipGroup, InputChip } from "@/shared/ds/chip";
import { List, ListHeader, ListItem } from "@/shared/ds/list";
import { Skeleton } from "@/shared/ds/skeleton";
import { cn } from "@/shared/lib/cn";
import { KRW, minusOf } from "@/shared/lib/groo/format";
import { MaskAmount, WonUnit } from "@/shared/lib/groo/hide-amounts";
import { wonPre } from "@/shared/lib/groo/hide-amounts-core";
import type { ExpenseCategory } from "@/entities/expense";
import {
  activeConditionCount,
  type FilterValue,
} from "@/features/expense/model/filter";
import { GUTTER_OFF } from "@/pages/expense/model/mobile-consts";

/*
 * 폰 가계부의 조각들 — 옛 `shared/ui/groo/ledger` 부품(할 일 원장과 함께 쓴다)을 가계부만 ds 값으로 다시 짠 것이다(I-07 7 ~ 17).
 * 할 일 원장은 I-10 에서 따로 옮기므로 공용 부품은 그대로 두었다 — 거기서 걷는다.
 */

// ─── 월 이동 ────────────────────────────────────────────────

/** 월 이동 · 거르기 · 추가 줄 — 단추는 Button ghost medium iconOnly(보이는 40 · 아이콘 18 · 누르는 44) */
export function MonthNav({ children }: { children: ReactNode }) {
  return <div className="flex items-center">{children}</div>;
}

export function NavIconButton({
  label,
  onClick,
  disabled,
  className,
  children,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="medium"
      layout="iconOnly"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={className}
    >
      {children}
    </Button>
  );
}

/** 달 이름 — t6 18 / 24 · 700 · 고정폭 숫자 */
export function MonthLabel({ children }: { children: ReactNode }) {
  return (
    <span className="px-x1 text-t6 font-bold tabular-nums text-fg-neutral">
      {children}
    </span>
  );
}

export function PrevMonthButton({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  return (
    <NavIconButton label={label} onClick={onClick}>
      <ChevronLeft />
    </NavIconButton>
  );
}

export function NextMonthButton({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  return (
    <NavIconButton label={label} onClick={onClick}>
      <ChevronRight />
    </NavIconButton>
  );
}

// ─── 합계 · 인사이트 · 소비 요약 ─────────────────────────────

/** 머리 — 이달 지출 합계(지표 t9 24 / 32 · 700) + 인사이트 한 줄(t4 · 위 6) + 오른쪽 "소비 요약" */
export function LedgerHeadRow({
  total,
  insight,
  summaryLabel,
  summaryOpen,
  onToggleSummary,
}: {
  total: ReactNode;
  insight?: ReactNode;
  summaryLabel: string;
  summaryOpen: boolean;
  onToggleSummary: () => void;
}) {
  return (
    <div className="flex flex-wrap items-start gap-x3 pt-x2">
      <div className="min-w-0 flex-auto">
        <div className="num text-t9 font-bold tabular-nums text-fg-neutral">
          {total}
        </div>
        {insight && (
          <div className="mt-x1_5 text-t4 font-normal text-fg-neutral-muted">
            {insight}
          </div>
        )}
      </div>
      <Button
        type="button"
        variant="neutralOutline"
        size="small"
        aria-expanded={summaryOpen}
        onClick={onToggleSummary}
        className="ml-auto shrink-0"
      >
        {summaryLabel}
      </Button>
    </div>
  );
}

/** 펼친 소비 요약 — 카드 없이 보기만 하는 List 줄 셋(수입 · 지출 · 합계). 합계 줄 제목만 700 */
export function SummaryRows({
  incomeLabel,
  expenseLabel,
  totalLabel,
  monthIn,
  monthOut,
}: {
  incomeLabel: string;
  expenseLabel: string;
  totalLabel: string;
  monthIn: number;
  monthOut: number;
}) {
  return (
    <List className={cn("mt-x2", GUTTER_OFF)}>
      <ListItem
        title={incomeLabel}
        suffix={
          <span className="num font-bold tabular-nums text-fg-brand">
            <MaskAmount card="ledger.txList" kind="income">
              +{wonPre()}
              {withCommaBreaks(KRW(monthIn))}
            </MaskAmount>
            <WonUnit card="ledger.txList" kind="income" />
          </span>
        }
      />
      <ListItem
        title={expenseLabel}
        suffix={
          <span className="num font-bold tabular-nums text-fg-neutral">
            <MaskAmount card="ledger.txList" kind="expense">
              {minusOf(monthOut)}
              {wonPre()}
              {withCommaBreaks(KRW(Math.abs(monthOut)))}
            </MaskAmount>
            <WonUnit card="ledger.txList" kind="expense" />
          </span>
        }
      />
      <ListItem
        title={<span className="font-bold">{totalLabel}</span>}
        suffix={
          <span className="num font-bold tabular-nums text-fg-neutral">
            <MaskAmount card="ledger.txList" kind="net">
              {monthIn - monthOut >= 0 ? "+" : "−"}
              {wonPre()}
              {withCommaBreaks(KRW(Math.abs(monthIn - monthOut)))}
            </MaskAmount>
            <WonUnit card="ledger.txList" kind="net" />
          </span>
        }
      />
    </List>
  );
}

// ─── 주 달력 · 월 달력 ───────────────────────────────────────

/** 달력 영역 — 격자를 페이지 라인보다 8 바깥으로(셀 내용이 가운데 정렬이라 첫 · 끝 칸이 다른 요소와 같은 선에 선다) */
export function CalendarFrame({
  innerRef,
  children,
}: {
  innerRef: React.Ref<HTMLDivElement>;
  children: ReactNode;
}) {
  return (
    <div ref={innerRef} className="relative -mx-x2 pt-x3">
      {children}
    </div>
  );
}

/** 요일 줄 — t2 12 / 16 · 400 · fg-neutral-subtle, 일요일 fg-critical · 토요일 fg-brand */
export function DowRow({ labels }: { labels: string[] }) {
  return (
    <div className="grid grid-cols-7">
      {labels.map((d, i) => (
        <span
          key={i}
          className={cn(
            "pb-x2 pt-x1_5 text-center text-t2 font-normal",
            i === 0
              ? "text-fg-critical"
              : i === 6
                ? "text-fg-brand"
                : "text-fg-neutral-subtle",
          )}
        >
          {d}
        </span>
      ))}
    </div>
  );
}

export function WeekRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-7">{children}</div>;
}

const CELL =
  "group/cell flex min-h-x14 flex-col items-center gap-x1 rounded-r3 border-0 bg-transparent px-0 pb-x2 pt-x1 [-webkit-tap-highlight-color:transparent]";

/** 날짜 칸 — 비면 자리만 채우고, 아니면 누르는 칸(고른 날로 옮기기) */
export function CalendarCell({
  empty,
  selected,
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & { empty?: boolean; selected?: boolean }) {
  if (empty) return <div className={cn(CELL, className)}>{children}</div>;
  return (
    <button
      type="button"
      data-sel={selected}
      className={cn(
        CELL,
        "cursor-pointer active:bg-bg-layer-default-pressed",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * 날 숫자 — 지난 날 · 오늘 fg-neutral, **오는 날 fg-neutral-subtle**(불투명도로 흐리지 않는다 — v106),
 * 일요일 fg-critical · 토요일 fg-brand(캘린더 정합). 고른 날은 브랜드 채움 알약.
 */
export function CellNumber({
  day,
  dow,
  future,
  selected,
}: {
  day: number;
  dow: number;
  future: boolean;
  selected: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-x9 min-w-x9 items-center justify-center rounded-full px-x1 text-t5 tabular-nums",
        selected
          ? "bg-bg-brand-solid font-bold text-static-white"
          : cn(
              "font-medium",
              future
                ? "text-fg-neutral-subtle"
                : dow === 0
                  ? "text-fg-critical"
                  : dow === 6
                    ? "text-fg-brand"
                    : "text-fg-neutral",
            ),
      )}
    >
      {day}
    </span>
  );
}

/** 칸 금액 — t1 11 · 700 · 고정폭(눈금 밖 10 을 눈금으로). 지출 fg-neutral · 수입 fg-brand */
export function CellAmount({
  tone,
  children,
}: {
  tone?: "expense" | "income";
  children?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "num min-h-3 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-t1 font-bold tabular-nums",
        tone === "income" ? "text-fg-brand" : "text-fg-neutral",
      )}
    >
      {children}
    </span>
  );
}

/** 주 1줄 ↔ 월 전체 펼침 — Button ghost medium iconOnly, 이름은 늘 "월 달력" + aria-expanded */
export function ExpandButton({
  label,
  expanded,
  onClick,
}: {
  label: string;
  expanded: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex justify-center">
      <Button
        type="button"
        variant="ghost"
        size="medium"
        layout="iconOnly"
        aria-label={label}
        aria-expanded={expanded}
        onClick={onClick}
      >
        {expanded ? <ChevronUp /> : <ChevronDown />}
      </Button>
    </div>
  );
}

/** 칸 툴팁 — chart 툴팁 값(머리 t2 · 줄 "■ 지출 …원" t3 · 떠 있는 표면 · 모서리 12 · s3) 그대로 */
export function CellTooltip({
  left,
  top,
  title,
  rows,
}: {
  left: number;
  top: number;
  title: ReactNode;
  rows: { name: string; color: string; value: number; node: ReactNode }[];
}) {
  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{ left, top, transform: "translate(-50%, calc(-100% - 8px))" }}
    >
      <ChartTooltipContent
        active
        label={title}
        payload={rows.map((r) => ({
          name: r.name,
          dataKey: r.name,
          value: r.value,
          color: r.color,
        }))}
        valueFormatter={(_, key) =>
          rows.find((r) => r.name === key)?.node ?? null
        }
      />
    </div>
  );
}

// ─── 날짜 묶음 ───────────────────────────────────────────────

/**
 * 날짜 묶음 머리 — ds List Header mediumWeak(t4 14 / 19 · 500 · fg-neutral-subtle · 위아래 8). 오른쪽에 그날 합계가 있어
 * 머리는 div 로 두고 날짜 글만 h2 로 감싼다(합계가 머리말 이름에 섞이지 않게). 머리 위 12 · 첫 묶음 4.
 * 좌우 24 는 호스트가 쥐고 있어 걷는다(GUTTER_OFF 와 같은 까닭 · 같은 몫).
 */
export function DayHeader({
  first,
  title,
  sum,
}: {
  first: boolean;
  title: ReactNode;
  sum?: ReactNode;
}) {
  return (
    <ListHeader as="div" className={cn("px-0", first ? "mt-x1" : "mt-x3")}>
      <h2 className="m-0 font-[inherit] text-[length:inherit]">{title}</h2>
      {sum}
    </ListHeader>
  );
}

// ─── 필터가 걸렸을 때 칩 줄 ──────────────────────────────────

/**
 * 걸린 조건마다 입력값 칩 + 지우기(ds Input Chip — 지우기 이름 "{글} 지우기"). 한 줄 가로 스크롤, 양 끝 Scroll Fog 20(묶음이 건다).
 * 부모가 화면 여백 24 를 쥐므로 줄은 화면 끝까지 낸다(bleed).
 */
export function FilterChipsRow({
  filterValue,
  onChange,
  assetName,
  onClearAsset,
  categories,
  assets,
}: {
  filterValue: FilterValue | null;
  onChange: (v: FilterValue | null) => void;
  assetName?: string;
  onClearAsset: () => void;
  categories: ExpenseCategory[];
  assets: { rowId: number; assetName: string }[];
}) {
  const { t } = useTranslation("expense");
  const v = filterValue;
  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  if (assetName) {
    chips.push({
      key: "assetQ",
      label: t("assetFilterBadge", { name: assetName }),
      onRemove: onClearAsset,
    });
  }
  if (v) {
    // v2 는 조건이 여러 칸이라 항목마다 칩을 세우면 줄이 넘친다.
    // **칸 단위 요약 칩**으로 줄이고, 지우기는 그 칸을 통째로 비운다.
    if (activeConditionCount(v) > 1 && v.match === "any") {
      chips.push({
        key: "match",
        label: t("filter.matchAny"),
        onRemove: () => onChange({ ...v, match: "all" }),
      });
    }
    if (v.periods.length > 1) {
      chips.push({
        key: "periods",
        label: t("filter.chipPeriods", { count: v.periods.length }),
        onRemove: () => onChange({ ...v, periods: v.periods.slice(0, 1) }),
      });
    } else if (v.periods.length === 1 && v.periods[0]) {
      const p = v.periods[0];
      chips.push({
        key: "period",
        label: `${p.start.slice(5).replace("-", ".")}~${p.end.slice(5).replace("-", ".")}`,
        onRemove: () => onChange({ ...v, periods: [] }),
      });
    }
    if (v.types.length === 1) {
      chips.push({
        key: "type",
        label: v.types[0] === "EXPENSE" ? t("expense") : t("income"),
        onRemove: () => onChange({ ...v, types: ["EXPENSE", "INCOME"] }),
      });
    }
    for (const [key, picked, nameOf] of [
      [
        "cat",
        v.categories,
        (id: number) =>
          categories.find((c) => c.rowId === id)?.categoryName ?? String(id),
      ],
      [
        "asset",
        v.assets,
        (id: number) =>
          assets.find((a) => a.rowId === id)?.assetName ?? String(id),
      ],
    ] as const) {
      const field = key === "cat" ? "categories" : "assets";
      if (picked.include.length === 1 && picked.include[0] != null) {
        chips.push({
          key: `${key}-in`,
          label: nameOf(picked.include[0]),
          onRemove: () =>
            onChange({ ...v, [field]: { ...picked, include: [] } }),
        });
      } else if (picked.include.length > 1) {
        chips.push({
          key: `${key}-in`,
          label: t(key === "cat" ? "filter.chipCats" : "filter.chipAssets", {
            count: picked.include.length,
          }),
          onRemove: () =>
            onChange({ ...v, [field]: { ...picked, include: [] } }),
        });
      }
      if (picked.exclude.length > 0) {
        chips.push({
          key: `${key}-ex`,
          label:
            picked.exclude.length === 1 && picked.exclude[0] != null
              ? t("filter.chipExcludeOne", { name: nameOf(picked.exclude[0]) })
              : t("filter.excluded", { count: picked.exclude.length }),
          onRemove: () =>
            onChange({ ...v, [field]: { ...picked, exclude: [] } }),
        });
      }
    }
    if (v.amountRanges.length > 0) {
      chips.push({
        key: "amount",
        label: t("filter.chipAmountRanges", { count: v.amountRanges.length }),
        onRemove: () => onChange({ ...v, amountRanges: [] }),
      });
    }
  }
  if (chips.length === 0) return null;
  return (
    <ChipGroup
      layout="scroll"
      bleed
      aria-label={t("filter.appliedGroup")}
      className="py-x2"
    >
      {chips.map((c) => (
        <InputChip key={c.key} size="medium" onRemove={c.onRemove}>
          {c.label}
        </InputChip>
      ))}
    </ChipGroup>
  );
}

// ─── 기다림 ──────────────────────────────────────────────────

/** 거래 줄 스켈레톤 — List 두 줄 줄과 같은 짜임이라 높이가 같다(66). 타일 12 · 제목 t5 · 설명 t3 · 금액 t5 */
export function RowSkeleton() {
  return (
    <List className={GUTTER_OFF} aria-hidden>
      <ListItem
        align="top"
        prefix={<Skeleton radius="12" className="size-x10" />}
        title={<Skeleton text="t5" className="w-40 max-w-full" />}
        detail={<Skeleton text="t3" className="w-24 max-w-full" />}
        suffix={<Skeleton text="t5" className="w-x16" />}
      />
    </List>
  );
}

/** 날짜 묶음 하나의 스켈레톤 — 머리 글 t4 + 줄 */
export function DayGroupSkeleton({
  rows,
  first,
}: {
  rows: number;
  first: boolean;
}) {
  return (
    <div>
      <ListHeader as="div" className={cn("px-0", first ? "mt-x1" : "mt-x3")}>
        <Skeleton text="t4" className="w-x16" />
      </ListHeader>
      {Array.from({ length: rows }, (_, i) => (
        <RowSkeleton key={i} />
      ))}
    </div>
  );
}
