import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import {
  blockNonDigitKey,
  sanitizeAmountInput,
} from "@/shared/lib/porest/amount";
import { useTranslation } from "react-i18next";
import type { Asset } from "@/entities/asset";
import type { ExpenseCategory, ExpenseType } from "@/entities/expense";
import { ModalShell } from "@/shared/ui/porest/dialogs";
import { ModalFooter } from "@/shared/ui/porest/modal-footer";
import { Button } from "@/shared/ui/button";
import { CategoryGrid, CategoryTile } from "@/shared/ui/category-tile";
import { Input } from "@/shared/ui/input";
import { Field, FieldLabel } from "@/shared/ui/field";
import { InputDatePicker } from "@/shared/ui/input-date-picker";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Toggle } from "@/shared/ui/toggle";
import { TxTypeToggle, type TxTypeOption } from "@/entities/expense";
import {
  resolvePeriod,
  DEFAULT_FILTER,
  MAX_AMOUNT_RANGES,
  MAX_PERIODS,
  activeConditionCount,
  type AmountRange,
  type FilterPeriodPreset,
  type FilterPeriodRange,
  type FilterValue,
  type IncludeExclude,
  type MatchMode,
} from "../model/filter";

const PERIODS: { v: FilterPeriodPreset; lKey: string }[] = [
  { v: "week", lKey: "filter.period.week" },
  { v: "month", lKey: "filter.period.month" },
  { v: "3m", lKey: "stats.period3m" },
  { v: "custom", lKey: "filter.period.custom" },
];

/** 칩 3상태 — 고름 → 빼고 → 해제. */
function cycleChip(cur: IncludeExclude, id: number): IncludeExclude {
  if (cur.include.includes(id)) {
    return {
      include: cur.include.filter((x) => x !== id),
      exclude: [...cur.exclude, id],
    };
  }
  if (cur.exclude.includes(id)) {
    return {
      include: cur.include,
      exclude: cur.exclude.filter((x) => x !== id),
    };
  }
  return { include: [...cur.include, id], exclude: cur.exclude };
}

function RowRemove({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      onClick={onClick}
      className="size-8 shrink-0 text-[var(--fg-tertiary)]"
    >
      <X className="size-4" />
    </Button>
  );
}

export function FilterDialog({
  initial,
  defaultPeriod,
  categories,
  assets,
  onClose,
  onApply,
  mobile,
}: {
  initial?: FilterValue | null;
  /** 보고 있는 달의 기간 — 처음 열 때와 초기화에 쓴다(`monthPeriodOf`). 없으면 이번 달. */
  defaultPeriod?: FilterPeriodRange;
  categories: ExpenseCategory[];
  assets: Asset[];
  onClose: () => void;
  onApply: (v: FilterValue) => void;
  mobile: boolean;
}) {
  const { t } = useTranslation("expense");
  const TYPES: TxTypeOption[] = [
    { value: "EXPENSE", label: t("expense") },
    { value: "INCOME", label: t("income") },
  ];
  const start = initial ?? DEFAULT_FILTER;

  const [match, setMatch] = useState<MatchMode>(start.match);
  const [periods, setPeriods] = useState<FilterPeriodRange[]>(
    start.periods.length > 0
      ? start.periods
      : [defaultPeriod ?? resolvePeriod("month")],
  );
  const [types, setTypes] = useState<ExpenseType[]>(start.types);
  const [cats, setCats] = useState<IncludeExclude>(start.categories);
  const [accs, setAccs] = useState<IncludeExclude>(start.assets);
  const [amounts, setAmounts] = useState<AmountRange[]>(start.amountRanges);

  const parentCategories = useMemo(
    () =>
      categories
        .filter((c) => c.parentRowId == null)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [categories],
  );

  const draft: FilterValue = {
    match,
    periods,
    types,
    categories: cats,
    assets: accs,
    amountRanges: amounts,
  };
  const conditionCount = activeConditionCount(draft);
  // 조건이 하나뿐이면 "모두"와 "하나라도"가 같은 결과다 — 고르게 두면 헷갈린다.
  const matchDisabled = conditionCount <= 1;

  const reset = () => {
    setMatch("all");
    setPeriods([defaultPeriod ?? resolvePeriod("month")]);
    setTypes(DEFAULT_FILTER.types);
    setCats({ include: [], exclude: [] });
    setAccs({ include: [], exclude: [] });
    setAmounts([]);
  };

  const badPeriod = periods.some((p) => p.start && p.end && p.start > p.end);

  const setPeriodAt = (i: number, next: FilterPeriodRange) =>
    setPeriods(periods.map((p, k) => (k === i ? next : p)));

  return (
    <ModalShell
      title={t("filter.title")}
      onClose={onClose}
      size="md"
      footer={
        <ModalFooter
          onCancel={reset}
          cancelLabel={t("filter.reset")}
          onSave={() =>
            onApply({ ...draft, match: matchDisabled ? "all" : match })
          }
          saveLabel={t("filter.apply")}
          saveDisabled={badPeriod}
        />
      }
      mobile={mobile}
    >
      {/* 조건을 어떻게 묶을지 — 기간·'빼고'는 여기에 안 걸린다(항상 함께 적용). */}
      <Field style={{ marginBottom: 16 }}>
        <FieldLabel>{t("filter.match")}</FieldLabel>
        <Tabs
          value={matchDisabled ? "all" : match}
          onValueChange={(v) => v && !matchDisabled && setMatch(v as MatchMode)}
        >
          <TabsList variant="pill" size="sm" className="w-full">
            <TabsTrigger
              value="all"
              className="flex-1"
              disabled={matchDisabled}
            >
              {t("filter.matchAll")}
            </TabsTrigger>
            <TabsTrigger
              value="any"
              className="flex-1"
              disabled={matchDisabled}
            >
              {t("filter.matchAny")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {matchDisabled && (
          <div
            style={{
              fontSize: "var(--text-caption)",
              color: "var(--fg-tertiary)",
              marginTop: 6,
            }}
          >
            {t("filter.matchHint")}
          </div>
        )}
      </Field>

      <Field style={{ marginBottom: 16 }}>
        <FieldLabel>{t("filter.period")}</FieldLabel>
        {periods.map((p, i) => (
          <div
            key={i}
            style={{ marginBottom: i === periods.length - 1 ? 0 : 12 }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Tabs
                value={p.preset}
                onValueChange={(v) =>
                  v && setPeriodAt(i, resolvePeriod(v as FilterPeriodPreset))
                }
              >
                <TabsList variant="pill" size="sm" className="w-full">
                  {PERIODS.map((o) => (
                    <TabsTrigger key={o.v} value={o.v} className="flex-1">
                      {t(o.lKey)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              {periods.length > 1 && (
                <RowRemove
                  label={t("filter.removeRow")}
                  onClick={() => setPeriods(periods.filter((_, k) => k !== i))}
                />
              )}
            </div>
            <div
              style={{
                marginTop: 10,
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                gap: 8,
                alignItems: "center",
              }}
            >
              <InputDatePicker
                value={p.start}
                onValueChange={(v) =>
                  setPeriodAt(i, { ...p, preset: "custom", start: v })
                }
                placeholder={t("filter.startDate")}
              />
              <span style={{ color: "var(--fg-tertiary)" }}>~</span>
              <InputDatePicker
                value={p.end}
                onValueChange={(v) =>
                  setPeriodAt(i, { ...p, preset: "custom", end: v })
                }
                placeholder={t("filter.endDate")}
              />
            </div>
          </div>
        ))}
        {badPeriod && (
          <div
            style={{
              fontSize: "var(--text-caption)",
              color: "var(--fg-expense)",
              marginTop: 6,
            }}
          >
            {t("filter.dateError")}
          </div>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 8,
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: "var(--text-caption)",
              color: "var(--fg-tertiary)",
            }}
          >
            {t("filter.periodAlwaysAnd")}
          </span>
          {periods.length < MAX_PERIODS && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPeriods([...periods, resolvePeriod("month")])}
            >
              <Plus className="size-3.5" />
              {t("filter.addPeriod")}
            </Button>
          )}
        </div>
      </Field>

      <Field style={{ marginBottom: 16 }}>
        <FieldLabel>{t("filter.txType")}</FieldLabel>
        <TxTypeToggle
          options={TYPES}
          value={types}
          onChange={(v) => setTypes(v as ExpenseType[])}
          mode="multi"
        />
      </Field>

      {parentCategories.length > 0 && (
        <Field style={{ marginBottom: 16 }}>
          <ChipLabel label={t("category")} picked={cats} t={t} />
          <CategoryGrid>
            {parentCategories.map((c) => (
              <CategoryTile
                key={c.rowId}
                name={c.categoryName}
                color={c.color ?? undefined}
                icon={c.icon}
                active={cats.include.includes(c.rowId)}
                excluded={cats.exclude.includes(c.rowId)}
                onClick={() => setCats(cycleChip(cats, c.rowId))}
              />
            ))}
          </CategoryGrid>
        </Field>
      )}

      {assets.length > 0 && (
        <Field style={{ marginBottom: 16 }}>
          <ChipLabel label={t("accountCard")} picked={accs} t={t} />
          {/* 다중선택 필터 칩 — spec toggle.md: outline Toggle + radius-md(둥근 사각형). pill 아님. */}
          <div className="flex flex-wrap gap-2">
            {assets.map((a) => {
              const off = accs.exclude.includes(a.rowId);
              return (
                <Toggle
                  key={a.rowId}
                  variant="outline"
                  size="sm"
                  pressed={accs.include.includes(a.rowId)}
                  onPressedChange={() => setAccs(cycleChip(accs, a.rowId))}
                  style={
                    off
                      ? {
                          borderColor: "var(--status-danger)",
                          background: "var(--status-danger-subtle)",
                          color: "var(--fg-expense)",
                          textDecoration: "line-through",
                        }
                      : undefined
                  }
                >
                  {a.assetName}
                </Toggle>
              );
            })}
          </div>
        </Field>
      )}

      <Field>
        <FieldLabel>{t("filter.amountRange")}</FieldLabel>
        {amounts.map((r, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                flex: 1,
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                gap: 8,
                alignItems: "center",
              }}
            >
              <Input
                className="num"
                value={r.min}
                onChange={(e) =>
                  setAmounts(
                    amounts.map((x, k) =>
                      k === i
                        ? { ...x, min: sanitizeAmountInput(e.target.value) }
                        : x,
                    ),
                  )
                }
                onKeyDown={blockNonDigitKey}
                placeholder={t("filter.minAmount")}
                inputMode="numeric"
              />
              <span style={{ color: "var(--fg-tertiary)" }}>~</span>
              <Input
                className="num"
                value={r.max}
                onChange={(e) =>
                  setAmounts(
                    amounts.map((x, k) =>
                      k === i
                        ? { ...x, max: sanitizeAmountInput(e.target.value) }
                        : x,
                    ),
                  )
                }
                onKeyDown={blockNonDigitKey}
                placeholder={t("filter.maxAmount")}
                inputMode="numeric"
              />
            </div>
            <RowRemove
              label={t("filter.removeRow")}
              onClick={() => setAmounts(amounts.filter((_, k) => k !== i))}
            />
          </div>
        ))}
        {amounts.length < MAX_AMOUNT_RANGES && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setAmounts([...amounts, { min: "", max: "" }])}
          >
            <Plus className="size-3.5" />
            {t("filter.addAmountRange")}
          </Button>
        )}
      </Field>
    </ModalShell>
  );
}

/** 칩 묶음의 제목 — 고른 수·뺀 수와 "한 번 더 누르면 빼고" 안내. */
function ChipLabel({
  label,
  picked,
  t,
}: {
  label: string;
  picked: IncludeExclude;
  t: (k: string, o?: Record<string, unknown>) => string;
}) {
  return (
    <FieldLabel>
      {label}
      {picked.include.length > 0 && (
        <span
          style={{
            color: "var(--fg-brand-strong)",
            fontWeight: "600",
            marginLeft: 4,
          }}
        >
          · {t("filter.countSelected", { count: picked.include.length })}
        </span>
      )}
      {picked.exclude.length > 0 && (
        <span
          style={{
            color: "var(--fg-expense)",
            fontWeight: "600",
            marginLeft: 4,
          }}
        >
          · {t("filter.excluded", { count: picked.exclude.length })}
        </span>
      )}
      <span
        style={{
          color: "var(--fg-tertiary)",
          fontWeight: 400,
          marginLeft: 6,
          fontSize: "var(--text-caption)",
        }}
      >
        {t("filter.chipLegend")}
      </span>
    </FieldLabel>
  );
}
