import { useMemo, useState } from "react";
import { sanitizeAmountInput } from "@/shared/lib/porest/amount";
import { useTranslation } from "react-i18next";
import type { Asset } from "@/entities/asset";
import type { ExpenseCategory, ExpenseType } from "@/entities/expense";
import { ModalShell } from "@/shared/ui/porest/dialogs";
import { ModalFooter } from "@/shared/ui/porest/modal-footer";
import { CategoryGrid, CategoryTile } from "@/shared/ui/category-tile";
import { Input } from "@/shared/ui/input";
import { Field, FieldLabel } from "@/shared/ui/field";
import { InputDatePicker } from "@/shared/ui/input-date-picker";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Toggle } from "@/shared/ui/toggle";
import { TxTypeToggle, type TxTypeOption } from "@/entities/expense";
import {
  DEFAULT_FILTER,
  type FilterPeriod,
  type FilterValue,
} from "../model/filter";

const PERIODS: { v: FilterPeriod; lKey: string }[] = [
  { v: "week", lKey: "filter.period.week" },
  { v: "month", lKey: "filter.period.month" },
  { v: "3m", lKey: "stats.period3m" },
  { v: "custom", lKey: "filter.period.custom" },
];

function toggleIn<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
function fmtYmd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
/** 종료일=오늘, 시작일=오늘 − 1개월 */
function defaultCustomRange(): { startDate: string; endDate: string } {
  const today = new Date();
  const start = new Date(today);
  start.setMonth(start.getMonth() - 1);
  return { startDate: fmtYmd(start), endDate: fmtYmd(today) };
}

export function FilterDialog({
  initial,
  categories,
  assets,
  onClose,
  onApply,
  mobile,
}: {
  initial?: FilterValue | null;
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
  const [period, setPeriod] = useState<FilterPeriod>(start.period);
  const initialRange = useMemo(() => {
    if (start.startDate && start.endDate) {
      return { startDate: start.startDate, endDate: start.endDate };
    }
    return defaultCustomRange();
  }, [start.startDate, start.endDate]);
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);

  // 'custom' 전환 시 값 비어있으면 기본(오늘~-1개월) 세팅
  const selectPeriod = (p: FilterPeriod) => {
    if (p === "custom") {
      const def = defaultCustomRange();
      if (!startDate) setStartDate(def.startDate);
      if (!endDate) setEndDate(def.endDate);
    }
    setPeriod(p);
  };
  const [types, setTypes] = useState<ExpenseType[]>(start.types);
  const [categoryIds, setCategoryIds] = useState<number[]>(start.categoryIds);
  const [assetIds, setAssetIds] = useState<number[]>(start.assetIds);
  const [min, setMin] = useState(start.min);
  const [max, setMax] = useState(start.max);

  // 탑레벨(부모 없는) 카테고리만 필터 그리드로 노출
  const parentCategories = useMemo(
    () =>
      categories
        .filter((c) => c.parentRowId == null)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [categories],
  );

  const reset = () => {
    setPeriod(DEFAULT_FILTER.period);
    setStartDate("");
    setEndDate("");
    setTypes(DEFAULT_FILTER.types);
    setCategoryIds([]);
    setAssetIds([]);
    setMin("");
    setMax("");
  };

  const apply = () =>
    onApply({
      period,
      startDate: period === "custom" ? startDate : "",
      endDate: period === "custom" ? endDate : "",
      types,
      categoryIds,
      assetIds,
      min,
      max,
    });

  const customInvalid =
    period === "custom" &&
    startDate !== "" &&
    endDate !== "" &&
    startDate > endDate;

  // '초기화'는 leftSlot(내용 폭, marginRight:auto)이 아니라 취소 슬롯으로 둔다 —
  // leftSlot 은 요약 텍스트용이라 균등 분배에서 빠지고, 좌측에 작은 글씨로 붙으면
  // 버튼인지 알아보기 어렵다. 취소 슬롯은 모바일에서 secondary(테두리 없는 회색
  // 채움) + lg 로 렌더돼 [초기화][필터 적용] 이 화면 폭을 반씩 나눠 갖는다
  // (spec drawer.md "flex:1 평등 분배" · button.md Migration notes 2026-08).
  const Footer = (
    <ModalFooter
      onCancel={reset}
      cancelLabel={t("filter.reset")}
      onSave={apply}
      saveLabel={t("filter.apply")}
      saveDisabled={customInvalid}
    />
  );

  return (
    <ModalShell
      title={t("filter.title")}
      onClose={onClose}
      size="md"
      footer={Footer}
      mobile={mobile}
    >
      <Field style={{ marginBottom: 16 }}>
        <FieldLabel>{t("filter.period")}</FieldLabel>
        <Tabs
          value={period}
          onValueChange={(v) => v && selectPeriod(v as FilterPeriod)}
        >
          <TabsList variant="pill" size="sm" className="w-full">
            {PERIODS.map((o) => (
              <TabsTrigger key={o.v} value={o.v} className="flex-1">
                {t(o.lKey)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {period === "custom" && (
          <div style={{ marginTop: 10 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                gap: 8,
                alignItems: "center",
              }}
            >
              <InputDatePicker
                value={startDate}
                onValueChange={setStartDate}
                placeholder={t("filter.startDate")}
              />
              <span style={{ color: "var(--fg-tertiary)" }}>~</span>
              <InputDatePicker
                value={endDate}
                onValueChange={setEndDate}
                placeholder={t("filter.endDate")}
              />
            </div>
            {customInvalid && (
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
          </div>
        )}
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
          <FieldLabel>
            {t("category")}
            {categoryIds.length > 0 && (
              <span
                style={{
                  color: "var(--fg-brand-strong)",
                  fontWeight: "600",
                  marginLeft: 4,
                }}
              >
                · {t("filter.countSelected", { count: categoryIds.length })}
              </span>
            )}
          </FieldLabel>
          <CategoryGrid>
            {parentCategories.map((c) => (
              <CategoryTile
                key={c.rowId}
                name={c.categoryName}
                color={c.color ?? undefined}
                icon={c.icon}
                active={categoryIds.includes(c.rowId)}
                onClick={() => setCategoryIds(toggleIn(categoryIds, c.rowId))}
              />
            ))}
          </CategoryGrid>
        </Field>
      )}

      {assets.length > 0 && (
        <Field style={{ marginBottom: 16 }}>
          <FieldLabel>
            {t("accountCard")}
            {assetIds.length > 0 && (
              <span
                style={{
                  color: "var(--fg-brand-strong)",
                  fontWeight: "600",
                  marginLeft: 4,
                }}
              >
                · {t("filter.countSelected", { count: assetIds.length })}
              </span>
            )}
          </FieldLabel>
          {/* 다중선택 필터 칩 — spec toggle.md: outline Toggle + radius-md(둥근 사각형). pill 아님. */}
          <div className="flex flex-wrap gap-2">
            {assets.map((a) => (
              <Toggle
                key={a.rowId}
                variant="outline"
                size="sm"
                pressed={assetIds.includes(a.rowId)}
                onPressedChange={() => setAssetIds(toggleIn(assetIds, a.rowId))}
              >
                {a.assetName}
              </Toggle>
            ))}
          </div>
        </Field>
      )}

      <Field>
        <FieldLabel>{t("filter.amountRange")}</FieldLabel>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            gap: 8,
            alignItems: "center",
          }}
        >
          <Input
            className="num"
            value={min}
            onChange={(e) => setMin(sanitizeAmountInput(e.target.value))}
            placeholder={t("filter.minAmount")}
            inputMode="numeric"
          />
          <span style={{ color: "var(--fg-tertiary)" }}>~</span>
          <Input
            className="num"
            value={max}
            onChange={(e) => setMax(sanitizeAmountInput(e.target.value))}
            placeholder={t("filter.maxAmount")}
            inputMode="numeric"
          />
        </div>
      </Field>
    </ModalShell>
  );
}
