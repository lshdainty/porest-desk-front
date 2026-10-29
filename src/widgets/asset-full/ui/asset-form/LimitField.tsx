import { Field } from "@/shared/ds/field";
import { AmountInput } from "@/shared/ui/groo/amount-input";
import { MAX_BALANCE } from "@/shared/lib/groo/amount";
import type { AssetForm } from "./use-asset-form";

/**
 * 한도 — 신용카드 "신용한도", 마이너스 통장 "약정 한도". 둘 다 선택이고 같은 credit_limit 컬럼을 쓴다(둘 다 '빌릴 수 있는 최대').
 * 한도 게이지는 신용카드에서만 그리므로 겸용해도 부딪히지 않는다.
 */
export function LimitField({ f }: { f: AssetForm }) {
  const {
    t,
    isOverdraft,
    isCreditCardEdit,
    creditLimit,
    setCreditLimit,
    unit,
  } = f;
  if (!isOverdraft && !isCreditCardEdit) return null;
  return (
    <Field
      label={
        isOverdraft
          ? t("editDialog.overdraftLimitLabel")
          : t("editDialog.creditLimit")
      }
      indicator={t("editDialog.optional")}
    >
      <AmountInput
        max={MAX_BALANCE}
        value={creditLimit}
        onValueChange={setCreditLimit}
        unit={unit}
      />
    </Field>
  );
}
