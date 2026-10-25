import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { CURRENCIES } from "@/shared/lib/groo/currency";

import type { AssetForm } from "./use-asset-form";

export function CurrencyFields({ f }: { f: AssetForm }) {
  const {
    uid,
    t,
    setCurrency,
    currency,
    exchangeRate,
    setExchangeRate,
    isForeign,
  } = f;
  return (
    <>
      {/* 통화·환율 — 세 묶음이 같은 칸을 쓴다(D1). 잔액 바로 아래인 이유는 이 칸이
          잔액의 단위를 정하기 때문이다. 카드·대출도 외화가 있다(해외 카드·외화 대출)
          — 자산 유형으로 가르지 않는다. 앱도 같은 규칙이다(desk-app #330). */}
      <div>
        <div className="flex gap-3">
          <div className="flex-1">
            <Label
              id={`${uid}currency-label`}
              className="text-[13px] font-medium mb-2 block"
            >
              {t("form.currency")}
            </Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger
                id="asset-edit-currency"
                aria-labelledby={`${uid}currency-label asset-edit-currency`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.symbol} {c.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isForeign && (
            <div className="flex-1">
              <Label
                htmlFor="asset-edit-fx-rate"
                className="text-[13px] font-medium mb-2 block"
              >
                {t("form.exchangeRate")}
              </Label>
              {/* 소수를 받는 칸이라 `blockNonDigitKey` 를 붙이지 않는다 —
                  붙이면 `.` 이 안 찍혀 1380.5 를 못 적는다. */}
              <Input
                id="asset-edit-fx-rate"
                inputMode="decimal"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                placeholder={t("form.exchangeRatePlaceholder", {
                  code: currency,
                })}
              />
            </div>
          )}
        </div>
        {isForeign && (
          <p className="text-[11.5px] text-[var(--fg-tertiary)] mt-1.5">
            {t("form.exchangeRateHint")}
          </p>
        )}
      </div>
    </>
  );
}
