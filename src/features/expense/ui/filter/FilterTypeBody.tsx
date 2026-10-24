import { useTranslation } from "react-i18next";
import { ChipGroup, ChipToggle } from "@/shared/ds/chip";
import type { ExpenseType } from "@/entities/expense";

/**
 * 거래 종류 본문 — 지출 · 수입을 Chip 으로 여럿 고르기(짧은 값 둘). 둘 다 끄면 둘 다 켠 것과 같다 — 종류 조건은
 * **하나만 골랐을 때만** 걸린다(`typeActive`). 그래서 끈 칩이 "수입만" 처럼 걸린 것으로 읽히지 않게, 칩 자체는 끄는 대로 두고
 * 판정은 모델이 한다.
 */
export function FilterTypeBody({
  value,
  onChange,
}: {
  value: ExpenseType[];
  onChange: (next: ExpenseType[]) => void;
}) {
  const { t } = useTranslation("expense");
  const toggle = (type: ExpenseType, on: boolean) =>
    onChange(
      on
        ? value.includes(type)
          ? value
          : [...value, type]
        : value.filter((x) => x !== type),
    );
  return (
    <ChipGroup aria-label={t("filter.txType")}>
      <ChipToggle
        variant="outlineWeak"
        size="medium"
        checked={value.includes("EXPENSE")}
        onCheckedChange={(on) => toggle("EXPENSE", on)}
      >
        {t("expense")}
      </ChipToggle>
      <ChipToggle
        variant="outlineWeak"
        size="medium"
        checked={value.includes("INCOME")}
        onCheckedChange={(on) => toggle("INCOME", on)}
      >
        {t("income")}
      </ChipToggle>
    </ChipGroup>
  );
}
