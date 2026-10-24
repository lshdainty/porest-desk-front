import { useId, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ChipGroup, ChipToggle } from "@/shared/ds/chip";
import { ListHeader } from "@/shared/ds/list";
import { PRIO_KEYS, type PrioKey } from "@/pages/todo/model/todo-ledger";

/** 조건 한 칸 — 조건 이름(시트 안 List Header h3) + 본문. 좌우 24 는 시트 본문 여백이 쥔다 */
export function TodoFilterSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex flex-col">
      <ListHeader as="h3" id={id} className="px-0">
        {label}
      </ListHeader>
      {children}
    </section>
  );
}

/**
 * 태그 칩 묶음 — Chip outlineWeak 여럿 고르기(줄바꿈). 칩 = 태그 이름들 + (그런 할 일이 있을 때만) 맨 뒤 "태그 없음".
 * "태그 없음" 의 값은 빈 글("")이다 — 거르기 모델이 분류가 빈 할 일을 그 글로 센다.
 */
export function TodoTagFilterBody({
  tags,
  hasUntagged,
  value,
  onChange,
}: {
  tags: string[];
  hasUntagged: boolean;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const { t } = useTranslation("todo");
  const toggle = (tag: string, on: boolean) =>
    onChange(
      on
        ? [...value.filter((x) => x !== tag), tag]
        : value.filter((x) => x !== tag),
    );
  const options = hasUntagged ? [...tags, ""] : tags;
  return (
    <ChipGroup aria-label={t("tag")}>
      {options.map((tag) => (
        <ChipToggle
          key={tag || "__none"}
          variant="outlineWeak"
          size="medium"
          checked={value.includes(tag)}
          onCheckedChange={(on) => toggle(tag, on)}
        >
          {tag || t("noTag")}
        </ChipToggle>
      ))}
    </ChipGroup>
  );
}

/** 우선순위 칩 묶음 — 같은 Chip 여럿 고르기 셋(중요 · 보통 · 여유). 색 점은 두지 않는다 */
export function TodoPrioFilterBody({
  value,
  onChange,
}: {
  value: PrioKey[];
  onChange: (next: PrioKey[]) => void;
}) {
  const { t } = useTranslation("todo");
  const toggle = (k: PrioKey, on: boolean) =>
    onChange(
      on ? [...value.filter((x) => x !== k), k] : value.filter((x) => x !== k),
    );
  return (
    <ChipGroup aria-label={t("form.priority")}>
      {PRIO_KEYS.map((k) => (
        <ChipToggle
          key={k}
          variant="outlineWeak"
          size="medium"
          checked={value.includes(k)}
          onCheckedChange={(on) => toggle(k, on)}
        >
          {t(`prio.${k}`)}
        </ChipToggle>
      ))}
    </ChipGroup>
  );
}
