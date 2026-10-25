import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import type { AssetForm } from "./use-asset-form";

export function PaymentAccountField({ f }: { f: AssetForm }) {
  const {
    uid,
    t,
    editingGroup,
    cardType,
    paymentAssetRowId,
    setPaymentAssetRowId,
    bankAccounts,
  } = f;
  return (
    <>
      {/* 신용카드는 결제일에 여기서 한 번에 빠지고, 체크카드는 긁는 즉시 빠진다 — 의미가 달라 라벨을 나눈다. */}
      {editingGroup === "card" && (
        <div>
          <Label
            id={`${uid}payacct-label`}
            className="text-[13px] font-medium mb-2 block"
          >
            {cardType === "CHECK"
              ? t("editDialog.linkedAccount")
              : t("editDialog.paymentAccount")}
          </Label>
          <Select
            value={
              paymentAssetRowId != null ? String(paymentAssetRowId) : undefined
            }
            onValueChange={(v) => setPaymentAssetRowId(v ? Number(v) : null)}
            disabled={bankAccounts.length === 0}
          >
            <SelectTrigger
              id={`${uid}payacct`}
              aria-labelledby={`${uid}payacct-label ${uid}payacct`}
            >
              <SelectValue
                placeholder={
                  bankAccounts.length === 0
                    ? t("editDialog.noCheckingAccount")
                    : cardType === "CHECK"
                      ? t("editDialog.selectLinkedAccount")
                      : t("editDialog.selectPaymentAccount")
                }
              />
            </SelectTrigger>
            <SelectContent>
              {bankAccounts.map((a) => (
                <SelectItem key={a.rowId} value={String(a.rowId)}>
                  {a.institution
                    ? `${a.institution} · ${a.assetName}`
                    : a.assetName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {cardType === "CHECK" && (
            <p className="text-[11.5px] text-[var(--fg-tertiary)] mt-1.5">
              {t("editDialog.linkedAccountHelp")}
            </p>
          )}
        </div>
      )}
    </>
  );
}
