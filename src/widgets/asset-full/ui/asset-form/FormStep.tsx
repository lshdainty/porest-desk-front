import { useEffect, useRef } from "react";
import { ResponsiveDialogBody } from "@/shared/ds/dialog";
import { FormFooter } from "@/shared/ui/groo/form-footer";
import type { AssetForm } from "./use-asset-form";
import { KindField } from "./KindField";
import { AccountFields } from "./AccountFields";
import { CardFields } from "./CardFields";
import { InvestFields } from "./InvestFields";
import { CheckRows } from "./CheckRows";
import { focusFirstField } from "./focus";

/**
 * 추가 · 수정 2단계(I-17 B · C) — 그 종류의 칸만. 칸 사이 24(Field ↔ Field), 마지막 칸 ↔ 체크 줄 둘은 한 면 안 16(T14).
 * 바닥은 [추가] · [저장] — 지금처럼 필수가 비면 눌리지 않는다(`canSubmit`). 열리면 첫 칸에 초점.
 */
export function FormStep({
  f,
  onSubmit,
  isSubmitting,
}: {
  f: AssetForm;
  onSubmit: () => void;
  isSubmitting?: boolean;
}) {
  const { t, tCommon, isNew, canSubmit, editingGroup } = f;
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    focusFirstField(bodyRef.current);
  }, []);
  return (
    <>
      <ResponsiveDialogBody ref={bodyRef} scrollFog>
        <div className="flex flex-col gap-x6 pb-x2">
          <KindField f={f} />
          {editingGroup === "card" ? (
            <CardFields f={f} />
          ) : editingGroup === "invest" ? (
            <InvestFields f={f} />
          ) : (
            <AccountFields f={f} />
          )}
        </div>
        <CheckRows f={f} />
      </ResponsiveDialogBody>
      <FormFooter
        cancelLabel={tCommon("cancel")}
        submitLabel={isNew ? t("addAction") : tCommon("save")}
        loading={isSubmitting}
        submitDisabled={!canSubmit}
        onSubmit={onSubmit}
      />
    </>
  );
}
