import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { DemoBlock } from "@/shared/ds/catalog/DemoKit";

import { MonthPicker, type MonthValue } from "./month-picker";

function MonthField({
  label,
  initial,
  yearRange,
}: {
  label: string;
  initial: MonthValue;
  yearRange?: { start: number; end: number };
}) {
  const [value, setValue] = useState(initial);
  return (
    <div className="flex items-center gap-x3">
      <span className="text-t4 text-fg-neutral-muted">{label}</span>
      <MonthPicker
        value={value}
        onValueChange={setValue}
        title="월 선택"
        doneLabel="완료"
        yearRange={yearRange}
        trigger={
          <button
            type="button"
            className="inline-flex min-h-11 cursor-pointer items-center gap-x1 border-0 bg-transparent p-0 font-sans text-t5 font-bold text-fg-neutral"
          >
            {value.year}년 {value.month}월
            <ChevronDown
              aria-hidden
              size={16}
              className="text-fg-neutral-muted"
            />
          </button>
        }
      />
    </div>
  );
}

/** 카탈로그(/dev/ds) — 눌러 본다: 1280 미만은 시트, 이상은 팝오버. 굴리는 동안 값은 그대로, "완료" 로 넣고 바깥 · Esc 로 닫으면 버린다 */
export const MonthPickerDemo = () => (
  <div className="flex flex-col gap-x8">
    <DemoBlock title="직접 눌러 본다 — 연 120 오른쪽 · 월 96 왼쪽(월은 돌아간다) · 열 때 지금 달에서 시작 · 연 범위는 오늘 ± 100년">
      <MonthField label="예산 달" initial={{ year: 2026, month: 10 }} />
    </DemoBlock>
    <DemoBlock title="가장 나쁜 값 — 연 범위 끝(2026 ~ 2027) · 12월에서 1월로 돌기">
      <MonthField
        label="범위 끝"
        initial={{ year: 2027, month: 12 }}
        yearRange={{ start: 2026, end: 2027 }}
      />
    </DemoBlock>
  </div>
);
