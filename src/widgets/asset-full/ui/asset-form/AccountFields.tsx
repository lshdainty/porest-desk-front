import type { AssetForm } from "./use-asset-form";
import { InstitutionBox } from "./InstitutionBox";
import { AccountSubTabs } from "./AccountSubTabs";
import { NameField } from "./NameField";
import { OverdraftLimit } from "./OverdraftLimit";
import { AmountBlock } from "./AmountBlock";
import { CurrencyFields } from "./CurrencyFields";
import { MemoField } from "./MemoField";
import { CheckToggles } from "./CheckToggles";

/** 계좌 묶음의 칸 — 기관 · 계좌 종류 · 별칭 · (마이너스통장) 약정 한도 · 금액 · 통화 · 메모 · 체크 줄 */
export function AccountFields({ f }: { f: AssetForm }) {
  return (
    <>
      <InstitutionBox f={f} />
      <AccountSubTabs f={f} />
      <NameField f={f} />
      <OverdraftLimit f={f} />
      <AmountBlock f={f} />
      <CurrencyFields f={f} />
      <MemoField f={f} />
      <CheckToggles f={f} />
    </>
  );
}
