import { Field } from "@/shared/ds/field";
import { Input } from "@/shared/ds/input";
import type { AssetForm } from "./use-asset-form";

/** 메모 — 계좌 · 투자 묶음, 추가 · 수정 모두. 120자. 카드 묶음에는 칸이 없다(저장 본문은 서버 값을 그대로 되돌려 싣는다) */
export function MemoField({ f }: { f: AssetForm }) {
  const { t, memo, setMemo } = f;
  return (
    <Field
      label={t("editDialog.memo")}
      indicator={t("editDialog.optional")}
      maxGraphemeCount={120}
    >
      <Input
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder={t("editDialog.memoPlaceholder")}
      />
    </Field>
  );
}
