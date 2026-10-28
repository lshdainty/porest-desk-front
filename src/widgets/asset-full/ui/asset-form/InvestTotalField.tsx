import { Field } from "@/shared/ds/field";
import { Input } from "@/shared/ds/input";
import { KRW } from "@/shared/lib/groo/format";
import { DEFAULT_CURRENCY, currencyUnit } from "@/shared/lib/groo/currency";
import type { AssetForm } from "./use-asset-form";

/**
 * 투자 보유가 있을 때의 평가액 합계 — 읽기 전용. 연동 합계만은 통화를 안 따른다: 시세를 원화로 환산해 더한 값이라(`live.unitKrw`)
 * 고른 통화를 붙이면 라벨이 값을 속인다.
 */
export function InvestTotalField({ f }: { f: AssetForm }) {
  const { t, holdingsTotal } = f;
  return (
    <Field
      label={t("editDialog.balanceLabelInvest")}
      description={t("holdings.balanceAutoHelp")}
    >
      <Input
        readOnly
        value={KRW(holdingsTotal)}
        suffix={currencyUnit(DEFAULT_CURRENCY)}
      />
    </Field>
  );
}
