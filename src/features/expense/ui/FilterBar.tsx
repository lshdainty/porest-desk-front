import { useRef, useState, type Ref } from "react";
import { ChevronDown, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Asset } from "@/entities/asset";
import type { ExpenseCategory, ExpenseType } from "@/entities/expense";
import {
  BottomSheet,
  BottomSheetBody,
  BottomSheetContent,
} from "@/shared/ds/bottom-sheet";
import { Chip, ChipGroup, InputChip, type ChipSize } from "@/shared/ds/chip";
import { ConditionPanel as SharedConditionPanel } from "@/shared/ui/groo/condition-panel";
import { formatRangeValue, parseDayKey } from "@/shared/ds/date-picker";
import {
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ds/popover";
import { money } from "@/shared/lib/groo/format";
import {
  DEFAULT_FILTER,
  activeConditionCount,
  hasActiveFilter,
  samePeriod,
  type AmountRange,
  type FilterPeriodRange,
  type FilterValue,
  type IncludeExclude,
  type MatchMode,
} from "../model/filter";
import {
  FilterAmountBody,
  FilterAssetBody,
  FilterCategoryBody,
  FilterMatchBody,
  FilterPeriodBody,
  FilterTypeBody,
} from "./filter";

/*
 * 필터 바 (짝 2 — I-07 28 ~ 30). 조건마다 칩 하나, 누르면 그 조건 하나만 연다 — 1280 이상 Popover(폭 400), 미만 Bottom Sheet.
 * "완료" 로만 반영한다 — 바깥 누름 · Esc · ✕ 는 바꾼 것을 버린다. "초기화" 는 그 조건만 비운다.
 * 조건 본문은 07-1 이 만든 조건 부품(`./filter/*`)을 그대로 나눠 담는다.
 */

/** 가계부 조건 면 — 공용 껍데기에 가계부 바닥 버튼 글을 준다 */
function ConditionPanel<T>(
  props: Omit<
    Parameters<typeof SharedConditionPanel<T>>[0],
    "resetLabel" | "doneLabel"
  >,
) {
  const { t } = useTranslation("expense");
  return (
    <SharedConditionPanel<T>
      {...props}
      resetLabel={t("filter.reset")}
      doneLabel={t("filter.done")}
    />
  );
}

/** 조건 맞추기 칩의 면 — 고르면 바로 적용하고 닫는다(하나 고르기라 바닥 버튼이 없다) */
function MatchPanel({
  value,
  size,
  wide,
  onPick,
}: {
  value: MatchMode;
  size: ChipSize;
  wide: boolean;
  onPick: (m: MatchMode) => void;
}) {
  const { t } = useTranslation("expense");
  const [open, setOpen] = useState(false);
  const own = useRef<HTMLButtonElement | null>(null);
  const chip = (
    <Chip
      ref={own}
      variant="solid"
      size={size}
      selected
      className="max-w-full"
      suffixIcon={<ChevronDown />}
      aria-haspopup="dialog"
      onClick={wide ? undefined : () => setOpen(true)}
    >
      {value === "any" ? t("filter.matchAny") : t("filter.matchAll")}
    </Chip>
  );
  const pick = (m: MatchMode) => {
    onPick(m);
    setOpen(false);
    if (!wide) requestAnimationFrame(() => own.current?.focus());
  };
  const content = (
    <FilterMatchBody value={value} onChange={pick} disabled={false} />
  );
  if (wide) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{chip}</PopoverTrigger>
        <PopoverContent
          title={t("filter.match")}
          align="start"
          className="w-[360px]"
        >
          <PopoverBody className="pb-x3">{content}</PopoverBody>
        </PopoverContent>
      </Popover>
    );
  }
  return (
    <>
      {chip}
      <BottomSheet open={open} form onOpenChange={setOpen}>
        <BottomSheetContent
          title={t("filter.match")}
          aria-describedby={undefined}
        >
          <BottomSheetBody className="pb-x4">{content}</BottomSheetBody>
        </BottomSheetContent>
      </BottomSheet>
    </>
  );
}

/** 고른 이름 요약 — 하나면 이름, 여럿이면 "{첫 이름} 외 N개" */
function summarize(
  t: (k: string, o?: Record<string, unknown>) => string,
  names: string[],
  exclude: boolean,
): string {
  const [first = ""] = names;
  if (exclude)
    return names.length === 1
      ? t("filter.chipExcludeOne", { name: first })
      : t("filter.chipExcludeMore", { first, count: names.length - 1 });
  return names.length === 1
    ? first
    : t("filter.chipMore", { first, count: names.length - 1 });
}

function amountText(
  t: (k: string, o?: Record<string, unknown>) => string,
  r: AmountRange,
): string {
  const min = r.min === "" ? null : Number(r.min);
  const max = r.max === "" ? null : Number(r.max);
  if (min != null && max != null)
    return t("filter.chipRange", { min: money(min), max: money(max) });
  if (min != null) return t("filter.chipMin", { amount: money(min) });
  return t("filter.chipMax", { amount: money(max ?? 0) });
}

const nonEmpty = (r: AmountRange) => r.min !== "" || r.max !== "";

export function FilterBar({
  value,
  onChange,
  categories,
  assets,
  wide,
  viewPeriod,
  assetName,
  onClearAsset,
  onClearAll,
  firstChipRef,
}: {
  value: FilterValue | null;
  /** 조건이 모두 풀린 값은 null 로 돌려준다 */
  onChange: (next: FilterValue | null) => void;
  categories: ExpenseCategory[];
  assets: Asset[];
  /** 1280 이상 — 칩 small 32 · 팝오버. 미만은 medium 36 · 시트 */
  wide: boolean;
  /** 보고 있는 달의 기간 — 같은 기간을 고르면 조건이 아니다(걸리지 않은 것으로 본다) */
  viewPeriod: FilterPeriodRange;
  /** 주소로 들어온 자산 거르기(서버 거르기) — 입력값 칩 */
  assetName?: string;
  onClearAsset: () => void;
  /** ↺ — 모든 조건과 들어온 자산을 푼다 */
  onClearAll: () => void;
  /** ↺ 뒤 초점이 갈 첫 조건 칩 */
  firstChipRef?: Ref<HTMLButtonElement>;
}) {
  const { t } = useTranslation("expense");
  const v = value ?? DEFAULT_FILTER;
  const size: ChipSize = wide ? "small" : "medium";
  const set = (patch: Partial<FilterValue>) => {
    const next: FilterValue = { ...v, ...patch };
    // 조건이 하나 이하로 줄면 "모두 일치" 로 돌아간다
    if (activeConditionCount(next) <= 1) next.match = "all";
    onChange(hasActiveFilter(next) ? next : null);
  };
  const catName = (id: number) =>
    categories.find((c) => c.rowId === id)?.categoryName ?? String(id);
  const assetNameOf = (id: number) =>
    assets.find((a) => a.rowId === id)?.assetName ?? String(id);

  const periodLabel = (() => {
    const text = (p: FilterPeriodRange) =>
      formatRangeValue(
        { start: parseDayKey(p.start), end: parseDayKey(p.end) },
        new Date(),
      );
    const [first] = v.periods;
    if (!first) return t("filter.period");
    return v.periods.length === 1
      ? text(first)
      : t("filter.chipMore", {
          first: text(first),
          count: v.periods.length - 1,
        });
  })();
  const typeActive = v.types.length === 1;
  const typeLabel = typeActive
    ? v.types[0] === "EXPENSE"
      ? t("expense")
      : t("income")
    : t("filter.txType");
  const catIds = v.categories.exclude.length
    ? v.categories.exclude
    : v.categories.include;
  const assetIds = v.assets.exclude.length
    ? v.assets.exclude
    : v.assets.include;
  const amounts = v.amountRanges.filter(nonEmpty);
  const showClear = hasActiveFilter(value) || !!assetName;
  const showMatch = activeConditionCount(v) >= 2;
  const hasParents = categories.some((c) => c.parentRowId == null);

  return (
    <ChipGroup
      layout="scroll"
      bleed
      role="group"
      aria-label={t("filter.barLabel")}
    >
      {showClear && (
        <Chip
          variant="outlineStrong"
          size={size}
          layout="iconOnly"
          aria-label={t("filter.clearAll")}
          onClick={onClearAll}
        >
          <RotateCcw />
        </Chip>
      )}
      {assetName && (
        <InputChip
          size={size}
          className="max-w-full"
          onRemove={onClearAsset}
          removeLabel={t("filter.assetClear", { name: assetName })}
        >
          {assetName}
        </InputChip>
      )}
      <ConditionPanel<FilterPeriodRange[]>
        chipRef={firstChipRef}
        chipLabel={periodLabel}
        active={v.periods.length > 0}
        title={t("filter.period")}
        size={size}
        wide={wide}
        initial={v.periods}
        empty={[]}
        canApply={(d) => !d.some((p) => p.start > p.end)}
        onApply={(d) =>
          set({
            // 보고 있는 달과 같은 기간 하나는 조건이 아니다
            periods:
              d.length === 1 && d[0] && samePeriod(d[0], viewPeriod) ? [] : d,
          })
        }
        body={(d, setD) => <FilterPeriodBody value={d} onChange={setD} />}
      />
      <ConditionPanel<ExpenseType[]>
        chipLabel={typeLabel}
        active={typeActive}
        title={t("filter.txType")}
        size={size}
        wide={wide}
        initial={v.types}
        empty={DEFAULT_FILTER.types}
        onApply={(d) =>
          // 둘 다 끄면 둘 다 켠 것과 같다
          set({ types: d.length === 0 ? DEFAULT_FILTER.types : d })
        }
        body={(d, setD) => <FilterTypeBody value={d} onChange={setD} />}
      />
      {hasParents && (
        <ConditionPanel<IncludeExclude>
          chipLabel={
            catIds.length > 0
              ? summarize(
                  t,
                  catIds.map(catName),
                  v.categories.exclude.length > 0,
                )
              : t("category")
          }
          active={catIds.length > 0}
          title={t("category")}
          size={size}
          wide={wide}
          initial={v.categories}
          empty={{ include: [], exclude: [] }}
          onApply={(d) => set({ categories: d })}
          body={(d, setD) => (
            <FilterCategoryBody
              categories={categories}
              value={d}
              onChange={setD}
            />
          )}
        />
      )}
      {assets.length > 0 && (
        <ConditionPanel<IncludeExclude>
          chipLabel={
            assetIds.length > 0
              ? summarize(
                  t,
                  assetIds.map(assetNameOf),
                  v.assets.exclude.length > 0,
                )
              : t("accountCard")
          }
          active={assetIds.length > 0}
          title={t("accountCard")}
          size={size}
          wide={wide}
          initial={v.assets}
          empty={{ include: [], exclude: [] }}
          onApply={(d) => set({ assets: d })}
          body={(d, setD) => (
            <FilterAssetBody assets={assets} value={d} onChange={setD} />
          )}
        />
      )}
      <ConditionPanel<AmountRange[]>
        chipLabel={
          amounts.length === 0
            ? t("filter.amountChip")
            : amounts.length === 1 && amounts[0]
              ? amountText(t, amounts[0])
              : t("filter.chipMore", {
                  first: amountText(t, amounts[0]!),
                  count: amounts.length - 1,
                })
        }
        active={amounts.length > 0}
        title={t("filter.amountRange")}
        size={size}
        wide={wide}
        initial={v.amountRanges}
        empty={[]}
        onApply={(d) => set({ amountRanges: d.filter(nonEmpty) })}
        body={(d, setD) => <FilterAmountBody value={d} onChange={setD} />}
      />
      {showMatch && (
        <MatchPanel
          value={v.match}
          size={size}
          wide={wide}
          onPick={(match) => set({ match })}
        />
      )}
    </ChipGroup>
  );
}
