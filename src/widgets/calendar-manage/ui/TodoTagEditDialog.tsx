import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Tag } from "lucide-react";
import { Button } from "@/shared/ds/button";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogCancel,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
} from "@/shared/ds/dialog";
import { Field } from "@/shared/ds/field";
import { Input } from "@/shared/ds/input";
import { ColorSwatchGroup } from "@/shared/ui/color-swatch";
import { NameCounter } from "@/shared/ui/groo/name-counter";
import { nameIssue } from "@/shared/lib/groo/name-policy";
import { CAT_PALETTE } from "@/shared/lib/groo/chart-palette";
import type { TodoTag } from "@/entities/todo-tag";

/**
 * 할 일 태그 추가 · 수정 — ds Responsive Dialog 입력 폼(I-10 37, 1280 이상 대화상자 · 미만 Bottom Sheet).
 * 구조 · 칸(미리보기 · 이름 12자 · 겹침 검사 · 색 고르기)은 그대로고 표면만 ds 다. 값이 바뀐 채 닫으면 작성한 내용이 사라져요를
 * 묻고 바깥을 눌러도 닫히지 않는다. 바닥 주 버튼은 추가 / 저장 하나.
 */
export function TagEditDialog({
  tag,
  existing,
  onClose,
  onSave,
  onDelete,
  submitting,
}: {
  tag: TodoTag | null;
  existing: TodoTag[];
  onClose: () => void;
  onSave: (values: { tagName: string; color: string }) => void;
  /** 수정일 때만 — 키보드 · 낭독기로 닿는 삭제 길(밀기는 손가락뿐). 확인은 부르는 쪽이 한 번 묻는다 */
  onDelete?: () => void;
  submitting?: boolean;
}) {
  const { t } = useTranslation("todo");
  const { t: tc } = useTranslation("common");
  const isNew = !tag;
  const initialIdx = (() => {
    if (!tag?.color) return 0;
    const idx = CAT_PALETTE.findIndex((p) => p.baseHex === tag.color);
    return idx >= 0 ? idx : 0;
  })();
  const initialName = tag?.tagName ?? "";
  const [name, setName] = useState(initialName);
  const [paletteIdx, setPaletteIdx] = useState(initialIdx);
  const [touched, setTouched] = useState(false);

  const palette = CAT_PALETTE[paletteIdx]!;
  const nameTrim = name.trim();
  // 라벨과 같은 이유 — 서버 409 는 나는데 다이얼로그가 조용했다(QA #55).
  const issue = nameIssue(
    name,
    12,
    existing.filter((x) => x.rowId !== tag?.rowId).map((x) => x.tagName),
  );
  const valid = issue == null;
  const err =
    touched && issue
      ? issue === "required"
        ? t("tags.nameRequired")
        : issue === "tooLong"
          ? t("tags.nameTooLong")
          : t("tags.nameDuplicate")
      : null;
  const dirty = name !== initialName || paletteIdx !== initialIdx;

  const save = () => {
    setTouched(true);
    if (!valid || submitting) return;
    onSave({ tagName: nameTrim, color: palette.baseHex });
  };

  return (
    <ResponsiveDialog
      open
      form
      dirty={dirty}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <ResponsiveDialogContent
        title={isNew ? t("tags.new") : t("tags.editTitle")}
      >
        <ResponsiveDialogBody>
          <div className="flex flex-col gap-x4 pb-x2">
            {/* 미리보기 */}
            <div
              className="flex items-center gap-x3 rounded-r3 p-x3_5"
              style={{ background: palette.bg }}
            >
              <span
                className="inline-flex size-x10 shrink-0 items-center justify-center rounded-r3 text-static-white"
                style={{
                  background: palette.color,
                  color: "var(--fg-on-brand)",
                }}
              >
                <Tag size={20} strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <div className="font-sans text-t2 font-medium text-fg-neutral-subtle">
                  {t("tags.preview")}
                </div>
                <div className="font-sans text-t5 font-bold text-fg-neutral [overflow-wrap:anywhere]">
                  {nameTrim || t("tags.new")}
                </div>
              </div>
            </div>
            <Field label={t("tags.name")}>
              <Input
                aria-invalid={!!err}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setTouched(true);
                }}
                placeholder={t("tags.namePlaceholder")}
                maxLength={14}
              />
              <NameCounter len={nameTrim.length} max={12} err={err} />
            </Field>
            <Field label={t("tags.color")}>
              <ColorSwatchGroup
                columns={5}
                value={String(paletteIdx)}
                onValueChange={(v) => setPaletteIdx(Number(v))}
                options={CAT_PALETTE.map((p, i) => ({
                  value: String(i),
                  bg: p.bg,
                  fg: p.color,
                  label: t("tags.colorN", { n: i + 1 }),
                }))}
              />
            </Field>
            {!isNew && onDelete && (
              <Button
                variant="ghost"
                ghostColor="critical"
                size="medium"
                flush="left"
                className="self-start"
                onClick={onDelete}
              >
                {tc("delete")}
              </Button>
            )}
          </div>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <ResponsiveDialogCancel>{tc("cancel")}</ResponsiveDialogCancel>
          <Button
            loading={submitting}
            disabled={touched && !valid}
            onClick={save}
          >
            {isNew ? t("tags.new") : tc("save")}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
