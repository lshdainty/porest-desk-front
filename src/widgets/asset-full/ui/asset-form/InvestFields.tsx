import type { AssetForm } from "./use-asset-form";
import { InstitutionBox } from "./InstitutionBox";
import { NameField } from "./NameField";
import { HoldingsEditor } from "./HoldingsEditor";
import { AmountBlock } from "./AmountBlock";
import { CurrencyFields } from "./CurrencyFields";
import { MemoField } from "./MemoField";
import { CheckToggles } from "./CheckToggles";

/** 투자 묶음의 칸 — 증권사 · 별칭 · 보유 종목 · 평가액 · 통화 · 메모 · 체크 줄 */
export function InvestFields({ f }: { f: AssetForm }) {
  return (
    <>
      <InstitutionBox f={f} />
      <NameField f={f} />
      <HoldingsEditor f={f} />
      <AmountBlock f={f} />
      <CurrencyFields f={f} />
      <MemoField f={f} />
      <CheckToggles f={f} />
    </>
  );
}
