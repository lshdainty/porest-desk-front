import { Field } from "@/shared/ds/field";
import { Select, SelectItem } from "@/shared/ds/select";
import type { AssetForm } from "./use-asset-form";

/** 결제 출금계좌(신용카드) · 연결 계좌(체크카드) — 입출금 계좌만 고른다. 신용카드는 결제일에 한 번에, 체크카드는 긁는 즉시 빠져 뜻이 달라 이름을 나눈다 */
export function PaymentAccountField({ f }: { f: AssetForm }) {
  const { t, kind, paymentAssetRowId, setPaymentAssetRowId, bankAccounts } = f;
  const check = kind === "체크카드";
  return (
    <Field
      label={
        check ? t("editDialog.linkedAccount") : t("editDialog.paymentAccount")
      }
      indicator={t("editDialog.optional")}
      description={
        check
          ? t("editDialog.linkedAccountHelp")
          : t("editDialog.paymentAccountHelp")
      }
    >
      <Select
        value={paymentAssetRowId != null ? String(paymentAssetRowId) : ""}
        onValueChange={(v) => setPaymentAssetRowId(v ? Number(v) : null)}
        disabled={bankAccounts.length === 0}
        placeholder={
          bankAccounts.length === 0
            ? t("editDialog.noCheckingAccount")
            : check
              ? t("editDialog.selectLinkedAccount")
              : t("editDialog.selectPaymentAccount")
        }
      >
        {bankAccounts.map((a) => (
          <SelectItem
            key={a.rowId}
            value={String(a.rowId)}
            label={
              a.institution ? `${a.institution} · ${a.assetName}` : a.assetName
            }
          />
        ))}
      </Select>
    </Field>
  );
}
