import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * 하위 카테고리 칸에는 상위 자신이 없다(QA 30 13). 이 칸은 하위가 있는 상위를 골랐을 때만
 * 뜨고, 하위가 있는 상위에는 서버가 거래·반복·프리셋을 안 받는다(EXP_009 · NOT_LEAF).
 */
describe("하위 카테고리 칸", () => {
  it.each([
    "src/widgets/add-tx/ui/AddTxSheet.tsx",
    "src/features/recurring-transaction/ui/RecurringAddDialog.tsx",
    "src/widgets/preset-manage/ui/PresetEditDialog.tsx",
  ])("%s — 상위를 선택지로 두지 않는다", (f) => {
    expect(readFileSync(f, "utf-8")).not.toContain(
      "<SelectItem value={String(selectedParentId)}>",
    );
  });
});
