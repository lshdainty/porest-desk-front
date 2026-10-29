import { Field } from "@/shared/ds/field";
import { AmountInput } from "@/shared/ui/groo/amount-input";
import { MAX_BALANCE } from "@/shared/lib/groo/amount";
import { formatDay } from "@/shared/lib/groo/format";
import type { AssetForm } from "./use-asset-form";

/**
 * 결제 대기 청구분 칸(2026-09-22) — 결제일 전에 등록하면 지난달 청구분은 다가오는 결제일에, 그 뒤 쓴 금액은 그다음 결제일에 빠진다.
 * 칸 이름에 그 날짜를 쓴다. 그 회차 결제일이 되면 잠긴다(읽기 전용 · 진한 글자).
 */
export function DueField({ f }: { f: AssetForm }) {
  const { t, dueField, dueStr, setDueStr, unit } = f;
  if (!dueField) return null;
  return (
    <Field
      data-testid="due-carryover"
      label={t("editDialog.dueCarryoverLabel", {
        date: formatDay(dueField.paymentDate).md,
      })}
      readOnly={dueField.locked}
      description={
        dueField.locked
          ? t("editDialog.carryoverLocked")
          : t("editDialog.dueCarryoverHelp")
      }
    >
      <AmountInput
        max={MAX_BALANCE}
        value={dueStr}
        onValueChange={setDueStr}
        unit={unit}
      />
    </Field>
  );
}
