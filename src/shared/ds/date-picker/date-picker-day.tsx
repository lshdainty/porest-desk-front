import * as React from "react";

import { cn } from "@/shared/lib/cn";

import {
  BAND,
  BAND_SIDE,
  CELL,
  DAY,
  DAY_PRESS,
  DAY_PRESS_ON_WEAK,
  DAY_RING,
  DAY_STATE,
  DAY_STRIKE,
  DAY_TODAY_WEIGHT,
  DAY_VISUAL,
  DAY_VISUAL_STATE,
  OUTSIDE,
} from "./date-picker-variants";
import { dayKey } from "./date-picker-dates";

/*
 * 날짜 칸 하나 — 달력(date-picker.tsx)이 그리고, 카탈로그 견본이 상태별로 한 칸씩 그려 검사기가 잰다(date-picker.demo.tsx).
 * 이 파일은 index.ts 로 내보내지 않는다(달력 안의 부품).
 *
 *   DayCell      칸(gridcell) 안에 기간 띠 · 날짜 버튼(원 · 숫자 · 링). 상태는 달력이 셈해 넘긴다
 *   OutsideCell  앞뒤 달 날짜 — 칸은 남기고(요일 짝) 숫자만 흐리게 보이고 보조 기술에 숨긴다. 버튼이 아니라 누르지 못한다
 *
 * 상태(date-picker.yaml · "상태가 겹칠 때")
 *   보통       숫자 fg-neutral-muted · 원 없음
 *   호버 · 누름 원 bg-layer-floating-pressed — 호버는 고운 포인터(마우스)만, 터치는 누르는 동안. 날짜는 줄지 않는다. 오늘(옅은 원) ·
 *              기간 사이 날(띠) 위에서는 한 단계 짙은 bg-neutral-weak-pressed. 고른 날 · 막힌 날 · 읽기 전용에는 없다
 *   오늘       원 bg-neutral-weak + 숫자 700 · fg-neutral. 고른 날 · 기간 안에서도 700 은 남는다. aria-current="date"
 *   고름       원 bg-neutral-inverted + 숫자 fg-neutral-inverted — 오늘이어도 이 모양
 *   기간 사이   원 없이 띠(bg-neutral-weak, 원 높이) — 시작 칸은 원 가운데부터 오른쪽, 끝 칸은 왼쪽부터 원 가운데까지, 사이 칸은 칸 폭 전체
 *   막힌 날    fg-disabled + 취소선 · cursor not-allowed · aria-disabled(초점은 간다). 미완성 기간의 시작이면 취소선을 긋지 않는다
 *   읽기 전용   원 stroke-neutral-solid + 숫자 fg-neutral-inverted · cursor default · aria-disabled · 이름 끝에 ", 읽기 전용 시작일"
 *   초점       키보드 초점에만 원 둘레 안쪽 2px 링(stroke-focus-ring)
 */

export type DayTone =
  "enabled" | "today" | "selected" | "inRange" | "disabled" | "readOnly";

export interface DayState {
  today: boolean;
  selected: boolean;
  rangeStart: boolean;
  rangeEnd: boolean;
  inRange: boolean;
  /** 기간이 시작 · 끝 모두 골라졌다 — 띠는 완성된 기간에만 */
  complete: boolean;
  /** 하루짜리 기간(시작 = 끝) — 띠가 없다 */
  singleDayRange: boolean;
  disabled: boolean;
  readOnly: boolean;
}

export interface DayCellProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onSelect" | "onFocus" | "onKeyDown"
> {
  date: Date;
  state: DayState;
  /** 버튼 이름 — "2026년 10월 15일 목요일" (읽기 전용이면 뒤에 말이 붙은 것) */
  label: string;
  /** Tab 자리 — 달력에서 날짜 하나만 0 */
  tabStop: boolean;
  onSelect: () => void;
  onFocus: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
}

const toneOf = (s: DayState): DayTone =>
  s.readOnly
    ? "readOnly"
    : s.selected
      ? "selected"
      : s.disabled
        ? "disabled"
        : s.inRange
          ? "inRange"
          : s.today
            ? "today"
            : "enabled";

function DayCell({
  date,
  state: s,
  label,
  tabStop,
  onSelect,
  onFocus,
  onKeyDown,
  className,
  ...props
}: DayCellProps) {
  const band =
    s.complete && !s.singleDayRange
      ? s.rangeStart
        ? "start"
        : s.rangeEnd
          ? "end"
          : s.inRange
            ? "middle"
            : null
      : null;
  const tone = toneOf(s);
  // 호버 · 누름 — 보통 날은 bg-layer-floating-pressed, 오늘 · 기간 사이 날은 한 단계 짙게. 고른 날 · 막힌 날 · 읽기 전용에는 없다
  const press =
    tone === "enabled"
      ? DAY_PRESS
      : tone === "today" || tone === "inRange"
        ? DAY_PRESS_ON_WEAK
        : null;
  // 미완성 기간의 시작은 막힌 날이어도 취소선을 긋지 않는다
  const strike = s.disabled && !s.readOnly && !(s.rangeStart && !s.complete);
  return (
    <div
      role="gridcell"
      aria-selected={s.selected || s.inRange || undefined}
      data-slot="date-picker-cell"
      data-band={band ?? undefined}
      className={cn(CELL, className)}
      {...props}
    >
      {band && (
        <span
          aria-hidden
          data-slot="date-picker-band"
          className={cn(BAND, BAND_SIDE[band])}
        />
      )}
      <button
        type="button"
        tabIndex={tabStop ? 0 : -1}
        aria-label={label}
        aria-current={s.today ? "date" : undefined}
        aria-disabled={s.disabled || s.readOnly || undefined}
        data-date={dayKey(date)}
        data-today={s.today || undefined}
        data-selected={s.selected || undefined}
        data-in-range={s.inRange || undefined}
        data-disabled={s.disabled || undefined}
        data-readonly={s.readOnly || undefined}
        className={cn(
          DAY,
          DAY_STATE[tone],
          s.today && DAY_TODAY_WEIGHT,
          s.selected && s.disabled && "cursor-not-allowed",
        )}
        onClick={onSelect}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
      >
        <span
          aria-hidden
          data-slot="date-picker-day-visual"
          className={cn(DAY_VISUAL, DAY_VISUAL_STATE[tone], press)}
        />
        <span
          data-slot="date-picker-day"
          className={cn("relative", strike && DAY_STRIKE)}
        >
          {date.getDate()}
        </span>
        <span
          aria-hidden
          data-slot="date-picker-day-ring"
          className={DAY_RING}
        />
      </button>
    </div>
  );
}

function OutsideCell({
  date,
  show = true,
  className,
  ...props
}: {
  date: Date;
  /** false 면 칸만 남기고 숫자를 그리지 않는다(이어지는 달 — 앞뒤 달 날짜는 비운다) */
  show?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="gridcell"
      data-slot="date-picker-cell"
      data-outside=""
      className={cn(CELL, className)}
      {...props}
    >
      {show && (
        <span aria-hidden data-slot="date-picker-outside" className={OUTSIDE}>
          {date.getDate()}
        </span>
      )}
    </div>
  );
}

export { DayCell, OutsideCell };
