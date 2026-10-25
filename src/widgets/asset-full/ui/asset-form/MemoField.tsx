import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

import type { AssetForm } from "./use-asset-form";

export function MemoField({ f }: { f: AssetForm }) {
  const { t, editingGroup, memo, setMemo } = f;
  return (
    <>
      {editingGroup !== "card" && (
        <div>
          <Label
            htmlFor="asset-edit-memo"
            className="text-[13px] font-medium mb-2 block"
          >
            {t("editDialog.memoOptional")}
          </Label>
          <Input
            id="asset-edit-memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder={t("editDialog.memoPlaceholder")}
            maxLength={120}
          />
        </div>
      )}
    </>
  );
}
