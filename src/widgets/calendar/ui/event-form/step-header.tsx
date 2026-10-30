import { useTranslation } from "react-i18next";

import { Button } from "@/shared/ds/button";

/**
 * 시트 안 한 단계의 머리 (I-09 29) — 같은 시트의 머리 · 본문이 바뀐다. 왼쪽 ← 와 제목은 ds Bottom Sheet 의 `onBack` 이 맡고,
 * 오른쪽은 닫기 원 자리의 "완료" 글 버튼(t4 14 · 700 · 보이는 36)이다. 그 단계가 열린 동안 닫기 원은 없다(시트 전체 닫기는 줄 칸 단계에서만).
 * 09b 의 일정 상세 단계도 같은 부품을 쓴다(오른쪽 자리만 닫기 원).
 */
export function SheetStepDone({
  onClick,
  label,
}: {
  onClick: () => void;
  /** 기본 "완료" */
  label?: string;
}) {
  const { t: tc } = useTranslation("common");
  return (
    <div
      data-slot="sheet-step-done"
      className="absolute right-[calc(var(--spacing-global-gutter)-8px)] top-[calc(var(--spacing-x6)+14px)] z-1 -translate-y-1/2"
    >
      <Button
        variant="ghost"
        ghostColor="neutral"
        size="small"
        onClick={onClick}
        className="font-bold"
      >
        {label ?? tc("done")}
      </Button>
    </div>
  );
}
