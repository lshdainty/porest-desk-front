import { Field } from "@/shared/ds/field";
import { Input } from "@/shared/ds/input";
import { ASSET_NAME_MAX } from "./form-lib";
import type { AssetForm } from "./use-asset-form";

/** 별칭 — 30자(Field 글자 수가 세고 최대에서 멈춘다) · 중복 오류는 Field 꼬리. 카드는 선택(비우면 상품 이름) */
export function NameField({ f }: { f: AssetForm }) {
  const {
    t,
    editingGroup,
    name,
    setName,
    nameErr,
    selectedCard,
    issues,
    showErrors,
  } = f;
  const missing = showErrors && issues.name;
  const placeholder =
    editingGroup === "invest"
      ? t("editDialog.namePlaceholderInvest")
      : editingGroup === "card"
        ? (selectedCard?.cardName ?? t("editDialog.namePlaceholderCard"))
        : t("editDialog.namePlaceholderAccount");
  return (
    <Field
      label={t("editDialog.nameLabel")}
      indicator={editingGroup === "card" ? t("editDialog.optional") : undefined}
      maxGraphemeCount={ASSET_NAME_MAX}
      invalid={!!nameErr || missing}
      errorMessage={nameErr ?? t("editDialog.errName")}
    >
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={placeholder}
      />
    </Field>
  );
}
