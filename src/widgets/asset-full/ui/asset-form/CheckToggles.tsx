import { EyeOff, Wallet } from "lucide-react";
import { Switch } from "@/shared/ui/switch";

import type { AssetForm } from "./use-asset-form";

export function CheckToggles({ f }: { f: AssetForm }) {
  const {
    t,
    isIncludedInTotal,
    setIsIncludedInTotal,
    isAmountHidden,
    setIsAmountHidden,
    unlockedRef,
  } = f;
  return (
    <>
      <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-muted text-[var(--fg-secondary)]">
          <Wallet size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-[var(--fg-primary)]">
            {t("editDialog.includeInTotal")}
          </div>
          <div className="mt-0.5 text-[11.5px] text-[var(--fg-secondary)]">
            {t("editDialog.includeInTotalDesc")}
          </div>
        </div>
        <Switch
          checked={isIncludedInTotal === "Y"}
          onCheckedChange={(b) => setIsIncludedInTotal(b ? "Y" : "N")}
        />
      </div>

      {/* 총액 제외 바로 아래 — 둘 다 자산 하나에 붙는 표시 규칙이라 나란히 둔다. */}
      <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-muted text-[var(--fg-secondary)]">
          <EyeOff size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-[var(--fg-primary)]">
            {t("editDialog.hideAmount")}
          </div>
          <div className="mt-0.5 text-[11.5px] text-[var(--fg-secondary)]">
            {t("editDialog.hideAmountDesc")}
          </div>
        </div>
        <Switch
          id="asset-edit-hide-amount"
          checked={isAmountHidden === "Y"}
          onCheckedChange={(b) => {
            // 다시 켜면 앞서 받은 확인은 무른다 — 또 끄면 다시 물어야 한다.
            if (b) unlockedRef.current = false;
            setIsAmountHidden(b ? "Y" : "N");
          }}
        />
      </div>
    </>
  );
}
