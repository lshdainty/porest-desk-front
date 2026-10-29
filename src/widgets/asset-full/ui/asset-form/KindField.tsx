import { ChipRadio, ChipRadioGroup } from "@/shared/ds/chip";
import { Field } from "@/shared/ds/field";
import { Select, SelectItem } from "@/shared/ds/select";
import {
  KIND_LABEL_KEY,
  isAccountKind,
  kindsOfSameGroup,
  type AssetKind,
} from "../../lib/asset-kind";
import type { AssetForm } from "./use-asset-form";

/**
 * 수정의 "종류" 칸(I-17 9) — 같은 묶음의 종류만 고른다. 계좌 여섯은 Select, 카드 둘(신용 · 체크)은 Chip 하나 고르기, 투자는 하나뿐이라 그리지 않는다.
 * 바꾸면 그 종류의 칸으로 바뀐다(카드 종류를 바꿔도 고른 상품은 남는다). 추가 2단계에는 없다(1단계가 정했다).
 */
export function KindField({ f }: { f: AssetForm }) {
  const { t, isNew, kind, setKind } = f;
  if (isNew || !kind) return null;
  const kinds = kindsOfSameGroup(kind);
  if (kinds.length < 2) return null;
  if (isAccountKind(kind)) {
    return (
      <Field label={t("editDialog.kindLabel")}>
        <Select value={kind} onValueChange={(v) => setKind(v as AssetKind)}>
          {kinds.map((k) => (
            <SelectItem key={k} value={k} label={t(KIND_LABEL_KEY[k])} />
          ))}
        </Select>
      </Field>
    );
  }
  return (
    <Field label={t("editDialog.kindLabel")}>
      <ChipRadioGroup
        aria-label={t("editDialog.kindLabel")}
        value={kind}
        onValueChange={(v) => setKind(v as AssetKind)}
      >
        {kinds.map((k) => (
          <ChipRadio key={k} value={k} variant="outlineStrong" size="medium">
            {t(KIND_LABEL_KEY[k])}
          </ChipRadio>
        ))}
      </ChipRadioGroup>
    </Field>
  );
}
