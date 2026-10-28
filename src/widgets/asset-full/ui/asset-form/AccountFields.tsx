import type { AssetForm } from "./use-asset-form";
import { InstitutionField } from "./InstitutionField";
import { NameField } from "./NameField";
import { MemoField } from "./MemoField";
import { BalanceField } from "./BalanceField";
import { LimitField } from "./LimitField";
import { CurrencyFields } from "./CurrencyFields";

/** 계좌 묶음의 칸 — 기관 → 별칭 → 메모 → 금액 → (마이너스 통장) 약정 한도 → 통화(+ 환율). 한 벌 차례는 I-17 11 */
export function AccountFields({ f }: { f: AssetForm }) {
  return (
    <>
      <InstitutionField f={f} />
      <NameField f={f} />
      <MemoField f={f} />
      <BalanceField f={f} />
      <LimitField f={f} />
      <CurrencyFields f={f} />
    </>
  );
}
