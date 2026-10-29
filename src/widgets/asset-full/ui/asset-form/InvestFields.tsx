import type { AssetForm } from "./use-asset-form";
import { InstitutionField } from "./InstitutionField";
import { NameField } from "./NameField";
import { HoldingsEditor } from "./HoldingsEditor";
import { BalanceField } from "./BalanceField";
import { InvestTotalField } from "./InvestTotalField";
import { CurrencyFields } from "./CurrencyFields";
import { MemoField } from "./MemoField";

/** 투자 묶음의 칸 — 증권사 → 별칭 → 보유 종목 → 예수금(보유 없을 때) / 평가액 합계(보유 있을 때 · 읽기 전용) → 통화 → 메모. 한 벌 차례는 I-17 11 */
export function InvestFields({ f }: { f: AssetForm }) {
  return (
    <>
      <InstitutionField f={f} />
      <NameField f={f} />
      <HoldingsEditor f={f} />
      {f.holdings.length > 0 ? (
        <InvestTotalField f={f} />
      ) : (
        <BalanceField f={f} />
      )}
      <CurrencyFields f={f} />
      <MemoField f={f} />
    </>
  );
}
