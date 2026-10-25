import { RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Chip, ChipGroup, type ChipSize } from "@/shared/ds/chip";
import { ConditionPanel } from "@/shared/ui/groo/condition-panel";
import {
  EMPTY_FILTER,
  isFilterActive,
  type PrioKey,
  type TodoFilter,
} from "@/pages/todo/model/todo-ledger";
import { TodoPrioFilterBody, TodoTagFilterBody } from "../TodoFilterBody";

/** 고른 이름 요약 — 하나면 이름, 여럿이면 "{첫 이름} 외 N개" (chip.md "외 N개") */
function summarize(
  t: (k: string, o?: Record<string, unknown>) => string,
  names: string[],
): string {
  const [first = ""] = names;
  return names.length === 1
    ? first
    : t("tdm.chipMore", { first, count: names.length - 1 });
}

/**
 * 거르기 칩 줄 — 필터 바 (I-10 30 · 부품과 값은 가계부 필터 바와 같다, I-07 28 · 30).
 * 차례: ↺(하나라도 걸리면 맨 앞) → 태그 ▾ → 우선순위 ▾ → 완료 숨기기. 1280 이상 칩 small 32 · 조건은 Popover(폭 400), 미만 medium 36 · Bottom Sheet.
 * 태그 · 우선순위는 누르면 그 조건 하나만 열고 [완료] 로 반영한다(바깥 누름 = 버림 · 초기화는 그 조건만). 걸리면 짙은 채움 + 값 요약("업무 외 2개").
 * 완료 숨기기는 켜고 끄는 칩(뒤 화살표 없음 · `aria-pressed`)이고 누르는 순간 걸린다. 개수 칩 · "모두 일치" 칩은 두지 않는다 — 조건끼리 늘 "모두".
 */
export function TodoFilterBar({
  value,
  onChange,
  tags,
  hasUntagged,
  wide,
  firstChipRef,
}: {
  value: TodoFilter;
  onChange: (next: TodoFilter) => void;
  tags: string[];
  hasUntagged: boolean;
  /** 1280 이상 — 칩 small 32 · 팝오버. 미만은 medium 36 · 시트 */
  wide: boolean;
  /** ↺ 뒤 초점이 갈 첫 조건 칩 */
  firstChipRef?: React.Ref<HTMLButtonElement>;
}) {
  const { t } = useTranslation("todo");
  const size: ChipSize = wide ? "small" : "medium";
  const active = isFilterActive(value);
  const tagLabel =
    value.tags.length > 0
      ? summarize(
          t,
          value.tags.map((x) => x || t("noTag")),
        )
      : t("tag");
  const prioLabel =
    value.prios.length > 0
      ? summarize(
          t,
          value.prios.map((k) => t(`prio.${k}`)),
        )
      : t("form.priority");
  const panelLabels = { resetLabel: t("tdm.reset"), doneLabel: t("tdm.apply") };
  return (
    <ChipGroup
      layout="scroll"
      bleed
      role="group"
      aria-label={t("tdm.filterBar")}
    >
      {active && (
        <Chip
          variant="outlineStrong"
          size={size}
          layout="iconOnly"
          aria-label={t("tdm.clearAll")}
          onClick={() => onChange(EMPTY_FILTER)}
        >
          <RotateCcw />
        </Chip>
      )}
      <ConditionPanel<string[]>
        chipRef={firstChipRef}
        chipLabel={tagLabel}
        active={value.tags.length > 0}
        title={t("tag")}
        size={size}
        wide={wide}
        initial={value.tags}
        empty={[]}
        onApply={(d) => onChange({ ...value, tags: d })}
        body={(d, setD) => (
          <TodoTagFilterBody
            tags={tags}
            hasUntagged={hasUntagged}
            value={d}
            onChange={setD}
          />
        )}
        {...panelLabels}
      />
      <ConditionPanel<PrioKey[]>
        chipLabel={prioLabel}
        active={value.prios.length > 0}
        title={t("form.priority")}
        size={size}
        wide={wide}
        initial={value.prios}
        empty={[]}
        onApply={(d) => onChange({ ...value, prios: d })}
        body={(d, setD) => <TodoPrioFilterBody value={d} onChange={setD} />}
        {...panelLabels}
      />
      <Chip
        variant="solid"
        size={size}
        selected={value.hideDone}
        aria-pressed={value.hideDone}
        onClick={() => onChange({ ...value, hideDone: !value.hideDone })}
      >
        {t("tdm.hideDoneChip")}
      </Chip>
    </ChipGroup>
  );
}
