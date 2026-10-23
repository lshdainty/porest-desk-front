import { useTranslation } from "react-i18next";
import { ChipGroup, ChipToggle } from "@/shared/ds/chip";
import type { ExpenseCategory } from "@/entities/expense";
import type { IncludeExclude } from "../../model/filter";
import { PickModeChips } from "./FilterIncludeExclude";
import { useIncludeExclude } from "./use-include-exclude";

/**
 * 카테고리 본문 — 먼저 "고른 것만 · 고른 것 빼고", 아래에서 카테고리를 칩으로 여럿 고른다(줄바꿈 묶음).
 * 부모 카테고리만 보인다 — 하위는 화면이 펼친다(`expandCats`).
 */
export function FilterCategoryBody({
  categories,
  value,
  onChange,
}: {
  categories: ExpenseCategory[];
  value: IncludeExclude;
  onChange: (next: IncludeExclude) => void;
}) {
  const { t } = useTranslation("expense");
  const pick = useIncludeExclude(value, onChange);
  const parents = categories
    .filter((c) => c.parentRowId == null)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    <div className="flex flex-col gap-x3">
      <PickModeChips
        mode={pick.mode}
        onChange={pick.setMode}
        name={t("category")}
      />
      <ChipGroup aria-label={t("category")}>
        {parents.map((c) => (
          <ChipToggle
            key={c.rowId}
            variant="outlineWeak"
            size="medium"
            checked={pick.ids.includes(c.rowId)}
            onCheckedChange={(on) => pick.toggle(c.rowId, on)}
          >
            {c.categoryName}
          </ChipToggle>
        ))}
      </ChipGroup>
    </div>
  );
}
