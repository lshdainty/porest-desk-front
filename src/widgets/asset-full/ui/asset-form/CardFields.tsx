import type { AssetForm } from "./use-asset-form";
import { CardTypeTabs } from "./CardTypeTabs";
import { CardProductList } from "./CardProductList";
import { NameField } from "./NameField";
import { CreditCardFields } from "./CreditCardFields";
import { AmountBlock } from "./AmountBlock";
import { CurrencyFields } from "./CurrencyFields";
import { PaymentAccountField } from "./PaymentAccountField";
import { CheckToggles } from "./CheckToggles";

/** 카드 묶음의 칸 — 카드 종류 · 카드 상품 · 별칭 · 신용한도 · 결제일 · 금액 · 통화 · 결제계좌 · 체크 줄 */
export function CardFields({ f }: { f: AssetForm }) {
  return (
    <>
      <CardTypeTabs f={f} />
      <CardProductList f={f} />
      <NameField f={f} />
      <CreditCardFields f={f} />
      <AmountBlock f={f} />
      <CurrencyFields f={f} />
      <PaymentAccountField f={f} />
      <CheckToggles f={f} />
    </>
  );
}
