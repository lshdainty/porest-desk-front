import { useId } from "react";
import { ResponsiveDialogBody } from "@/shared/ds/dialog";
import { Field } from "@/shared/ds/field";
import { ListHeader } from "@/shared/ds/list";
import { RadioSelectBox, RadioSelectBoxGroup } from "@/shared/ds/select-box";
import { cn } from "@/shared/lib/cn";
import { FormFooter } from "@/shared/ui/groo/form-footer";
import {
  KIND_GROUPS,
  KIND_ICON,
  KIND_LABEL_KEY,
  type AssetKind,
} from "../../lib/asset-kind";
import type { AssetForm } from "./use-asset-form";

/**
 * 추가 1단계 "무엇을 추가할까요?"(I-17 6) — 종류 아홉이 한 라디오 묶음이다(하나만 고른다).
 * 묶음 제목(계좌 · 카드 · 투자)은 그 아래 상자들의 이름(role="group")이다. 상자는 세로형 — 1280 미만 2열 · 이상 3열 —
 * 컨트롤 없이 테두리만으로 고른 것을 보인다. 상자를 누르는 것으로는 넘어가지 않는다(반영은 바닥 [다음]).
 * 고르지 않고 [다음] 을 누르면 묶음 아래 오류 글(버튼은 켜 둔다).
 */
export function KindStep({
  f,
  showError,
  onNext,
}: {
  f: AssetForm;
  showError: boolean;
  onNext: () => void;
}) {
  const { t, tCommon, kind, setKind } = f;
  const uid = useId();
  return (
    <>
      <ResponsiveDialogBody>
        <Field
          invalid={showError && kind == null}
          errorMessage={t("editDialog.pickKindError")}
        >
          <RadioSelectBoxGroup
            aria-label={t("editDialog.firstTitle")}
            value={kind ?? ""}
            onValueChange={(v) => setKind(v as AssetKind)}
            className="flex flex-col gap-0"
          >
            {KIND_GROUPS.map((g, i) => (
              <div
                key={g.group}
                role="group"
                aria-labelledby={`${uid}${g.group}`}
              >
                <ListHeader
                  id={`${uid}${g.group}`}
                  as="h3"
                  className={cn("px-0", i === 0 ? "pt-0" : "pt-x4")}
                >
                  {t(g.labelKey)}
                </ListHeader>
                <div className="grid auto-rows-fr grid-cols-2 gap-x-x3 gap-y-component-default lg:grid-cols-3">
                  {g.kinds.map((k) => {
                    const Icon = KIND_ICON[k];
                    return (
                      <RadioSelectBox
                        key={k}
                        value={k}
                        layout="vertical"
                        control="none"
                        prefix={<Icon aria-hidden />}
                        label={t(KIND_LABEL_KEY[k])}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </RadioSelectBoxGroup>
        </Field>
      </ResponsiveDialogBody>
      <FormFooter
        cancelLabel={tCommon("cancel")}
        submitLabel={tCommon("next")}
        onSubmit={onNext}
      />
    </>
  );
}
