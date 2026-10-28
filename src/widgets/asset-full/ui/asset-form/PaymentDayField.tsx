import { Field } from "@/shared/ds/field";
import { Select, SelectItem } from "@/shared/ds/select";
import type { AssetForm } from "./use-asset-form";

/** 결제일 — 신용카드 필수(없으면 청구 사이클을 세울 수 없다). 1 ~ 31일 */
export function PaymentDayField({ f }: { f: AssetForm }) {
  const {
    t,
    isCreditCardEdit,
    paymentDay,
    setPaymentDay,
    paymentDayConfirmedRef,
  } = f;
  if (!isCreditCardEdit) return null;
  return (
    <Field label={t("editDialog.paymentDay")}>
      <Select
        value={paymentDay}
        placeholder={t("editDialog.paymentDayPlaceholder")}
        onValueChange={(v) => {
          // 다시 고르면 앞서 받은 확인은 무른다 — 다른 날을 골랐을 수 있다(D5).
          paymentDayConfirmedRef.current = false;
          setPaymentDay(v);
        }}
      >
        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
          <SelectItem
            key={d}
            value={String(d)}
            label={t("editDialog.dayUnit", { day: d })}
          />
        ))}
      </Select>
    </Field>
  );
}
