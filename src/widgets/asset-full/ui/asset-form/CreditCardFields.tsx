import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  MAX_BALANCE,
  blockNonDigitKey,
  sanitizeAmountInput,
} from "@/shared/lib/groo/amount";

import type { AssetForm } from "./use-asset-form";

export function CreditCardFields({ f }: { f: AssetForm }) {
  const {
    uid,
    t,
    paymentDayConfirmedRef,
    creditLimit,
    setCreditLimit,
    paymentDay,
    setPaymentDay,
    unit,
    isCreditCardEdit,
  } = f;
  return (
    <>
      {/* 신용카드 — design 신판 순서: 신용한도 → 결제일 → 현재 사용액 → 결제 계좌(연동 유지) */}
      {isCreditCardEdit && (
        <>
          <div>
            <Label
              htmlFor="card-credit-limit"
              className="text-[13px] font-medium mb-2 block"
            >
              {t("editDialog.creditLimit", { unit })}
            </Label>
            <Input
              id="card-credit-limit"
              inputMode="numeric"
              value={creditLimit}
              onChange={(e) =>
                setCreditLimit(sanitizeAmountInput(e.target.value, MAX_BALANCE))
              }
              onKeyDown={blockNonDigitKey}
              placeholder={t("editDialog.creditLimitPlaceholder")}
            />
          </div>
          <div>
            <Label
              id={`${uid}payday-label`}
              className="text-[13px] font-medium mb-2 block"
            >
              {t("editDialog.paymentDay")}
            </Label>
            <Select
              value={paymentDay || undefined}
              onValueChange={(v) => {
                // 다시 고르면 앞서 받은 확인은 무른다 — 다른 날을 골랐을 수 있다(D5).
                paymentDayConfirmedRef.current = false;
                setPaymentDay(v);
              }}
            >
              <SelectTrigger
                id={`${uid}payday`}
                aria-labelledby={`${uid}payday-label ${uid}payday`}
              >
                <SelectValue
                  placeholder={t("editDialog.paymentDayPlaceholder")}
                />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {t("editDialog.dayUnit", { day: d })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </>
  );
}
