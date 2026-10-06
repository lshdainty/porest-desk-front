import { useState, type FocusEvent } from "react";

import { Button } from "@/shared/ds/button";
import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";

import {
  WheelPicker,
  WheelPickerColumn,
  type WheelPickerOption,
  type WheelPickerSize,
} from "./wheel-picker";

// 연 · 월 — 날짜 표기 그대로("2026년" · "10월"). 연은 처음 · 끝에서 멈추고 월은 반복한다
const YEARS: WheelPickerOption[] = Array.from({ length: 11 }, (_, i) => ({
  value: String(2021 + i),
  label: `${2021 + i}년`,
}));
const MONTHS: WheelPickerOption[] = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}월`,
}));
// 시 · 분 — 숫자만으로 읽히는 칼럼은 단위를 칼럼 이름으로 알린다
const HOURS: WheelPickerOption[] = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));
const MINUTES: WheelPickerOption[] = Array.from({ length: 60 }, (_, i) => ({
  value: String(i),
  label: String(i).padStart(2, "0"),
}));

const SIZES: WheelPickerSize[] = ["medium", "small"];
const COUNTS = [5, 7] as const;

// 검사기가 휠에 준 초점을 첫 칼럼으로 넘긴다 — 키보드로 칼럼에 들어온 자리(휠 자체는 초점이 서지 않는다)
function passFocus(e: FocusEvent<HTMLDivElement>) {
  if (e.target !== e.currentTarget) return;
  e.currentTarget
    .querySelector<HTMLElement>("[data-slot=wheel-picker-column]")
    ?.focus({ preventScroll: true });
}

/** 연 | 월 휠 견본 — 연 120 오른쪽 · 월 96 왼쪽 정렬(달력 머리 · 달만 고르기와 같은 모양), 폭 280 */
function MonthWheel({
  size,
  visibleItems,
  state = "enabled",
}: {
  size: WheelPickerSize;
  visibleItems: 5 | 7;
  state?: "enabled" | "focused" | "disabled";
}) {
  const focused = state === "focused";
  return (
    <div className="w-[280px]">
      <Specimen
        spec="wheel-picker"
        combo={{ size, visibleItems: String(visibleItems) }}
        state={state}
      >
        <WheelPicker
          aria-label="월 선택"
          size={size}
          visibleItems={visibleItems}
          disabled={state === "disabled"}
          tabIndex={focused ? -1 : undefined}
          onFocus={focused ? passFocus : undefined}
        >
          <WheelPickerColumn
            aria-label="연도"
            options={YEARS}
            defaultValue="2026"
            align="right"
            className="w-[120px]"
          />
          <WheelPickerColumn
            aria-label="월"
            options={MONTHS}
            defaultValue="10"
            align="left"
            className="w-[96px]"
            loop
          />
        </WheelPicker>
      </Specimen>
    </div>
  );
}

/** 직접 굴려 보기 — 멈춘 뒤 값이 정해지고(onValueChange), 바깥에서 값을 바꾸면 그 자리로 간다 */
function TryMonth() {
  const [year, setYear] = useState("2026");
  const [month, setMonth] = useState("10");
  return (
    <div className="flex w-[280px] flex-col gap-x3">
      <WheelPicker aria-label="월 선택">
        <WheelPickerColumn
          aria-label="연도"
          options={YEARS}
          align="right"
          className="w-[120px]"
          value={year}
          onValueChange={setYear}
        />
        <WheelPickerColumn
          aria-label="월"
          options={MONTHS}
          align="left"
          className="w-[96px]"
          loop
          value={month}
          onValueChange={setMonth}
          valueChangeBehavior="smooth"
        />
      </WheelPicker>
      <div className="flex items-center justify-between text-t4 text-fg-neutral">
        <span>
          고른 값: {year}년 {month}월
        </span>
        <Button
          variant="neutralWeak"
          size="small"
          onClick={() => {
            setYear("2026");
            setMonth("1");
          }}
        >
          2026년 1월로
        </Button>
      </div>
    </div>
  );
}

/** 직접 굴려 보기 — 시(오른쪽 정렬 · 반복) | 분(반복), small */
function TryTime() {
  return (
    <div className="w-[280px]">
      <WheelPicker aria-label="시각 선택" size="small">
        <WheelPickerColumn
          aria-label="시"
          options={HOURS}
          defaultValue="9"
          align="right"
          loop
        />
        <WheelPickerColumn
          aria-label="분"
          options={MINUTES}
          defaultValue="30"
          loop
        />
      </WheelPicker>
    </div>
  );
}

/** 카탈로그(/dev/ds) — 크기 × 보이는 칸, 키보드 초점 · 막힘, 직접 굴려 보기 */
export const WheelPickerDemo = () => (
  <div className="flex flex-col gap-x6">
    <DemoBlock title="크기 × 보이는 칸 — medium 44 · small 36, 5칸 · 7칸(연 | 월)">
      {SIZES.map((size) => (
        <DemoRow key={size} label={size}>
          {COUNTS.map((visibleItems) => (
            <MonthWheel
              key={visibleItems}
              size={size}
              visibleItems={visibleItems}
            />
          ))}
        </DemoRow>
      ))}
    </DemoBlock>
    <DemoBlock title="상태 — 키보드 초점(Tab 으로 칼럼에 들어오면 고른 항목 둘레 안쪽 링) · 막힘(고른 항목도 흐리게, 띠는 남는다)">
      {SIZES.map((size) => (
        <DemoRow key={size} label={size}>
          <MonthWheel size={size} visibleItems={5} state="focused" />
          <MonthWheel size={size} visibleItems={5} state="disabled" />
        </DemoRow>
      ))}
    </DemoBlock>
    <DemoBlock title="직접 굴려 보기 — 끌기 · 휠 · 누르기 · ↑ ↓ Home End, 값은 멈춘 뒤 한 번 정해진다">
      <DemoRow label="연 | 월">
        <TryMonth />
      </DemoRow>
      <DemoRow label="시 | 분 (small)">
        <TryTime />
      </DemoRow>
    </DemoBlock>
  </div>
);
