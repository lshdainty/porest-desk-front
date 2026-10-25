import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  MAX_BALANCE,
  blockNonDigitKey,
  sanitizeAmountInput,
} from "@/shared/lib/groo/amount";

import type { AssetForm } from "./use-asset-form";

export function OverdraftLimit({ f }: { f: AssetForm }) {
  const { t, creditLimit, setCreditLimit, isOverdraft, unit } = f;
  return (
    <>
      {/* 마이너스통장 약정 한도 — 선택 입력. 신용카드 한도와 같은 credit_limit 컬럼을 쓴다
          (둘 다 '빌릴 수 있는 최대'). 한도 게이지는 신용카드에서만 그리므로 겸용해도 부딪히지 않는다. */}
      {isOverdraft && (
        <div>
          <Label
            htmlFor="overdraft-limit"
            className="text-[13px] font-medium mb-2 block"
          >
            {t("editDialog.overdraftLimitLabel", { unit })}
          </Label>
          <Input
            id="overdraft-limit"
            inputMode="numeric"
            value={creditLimit}
            onChange={(e) =>
              setCreditLimit(sanitizeAmountInput(e.target.value, MAX_BALANCE))
            }
            onKeyDown={blockNonDigitKey}
            placeholder="0"
          />
        </div>
      )}
    </>
  );
}
