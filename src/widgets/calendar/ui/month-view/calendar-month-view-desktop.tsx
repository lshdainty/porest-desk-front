import { getDay, isSameDay, isToday, parseISO, startOfDay } from "date-fns";
import { useTranslation } from "react-i18next";
import { useCallback } from "react";

import { useCalendar } from "@/widgets/calendar/model/calendar-context";
import { useDragSelect } from "@/widgets/calendar/model/drag-select-context";
import { DragSelectProvider } from "@/widgets/calendar/model/drag-select-provider";
import {
  calculateMonthEventPositions,
  getCalendarCells,
} from "@/widgets/calendar/lib/helpers";
import { Card } from "@/shared/ds/card";
import { formatMonthDayWeekday, formatYearMonth } from "@/shared/lib/date";
import { cn } from "@/shared/lib/cn";

import type { IEvent } from "@/widgets/calendar/model/interfaces";
import { MonthChip, MonthChipSpacer, MonthMore } from "./month-chip";
import { buildMonthModel, type ChipMetrics } from "./month-model";
import { useChipMetrics } from "./use-chip-metrics";

const WEEK_DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEK_DAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];

/** 칸 104 − 위 4 − 날 숫자 26 − 아래 2 − 줄 사이 2 = 70, 칩 20 · "+N개" 18 · 사이 2 (글자 100% 의 값 — 실제로는 잰다) */
const DESKTOP_METRICS: ChipMetrics = { avail: 70, chip: 20, more: 18, gap: 2 };

/** 요일 머리 — 높이 36 · t3 13/18 · fg-neutral-subtle · 아래 1px 선. 일 fg-critical · 토 fg-brand */
export function WeekdayHead() {
  const { i18n } = useTranslation();
  const weekDays = i18n.language.startsWith("ko") ? WEEK_DAYS_KO : WEEK_DAYS_EN;
  return (
    <div
      aria-hidden
      className="grid h-x9 grid-cols-7 items-center border-b border-stroke-neutral-subtle text-center text-t3 text-fg-neutral-subtle"
    >
      {weekDays.map((day, index) => (
        <span
          key={day}
          className={cn(
            index === 0 && "text-fg-critical",
            index === 6 && "text-fg-brand",
          )}
        >
          {day}
        </span>
      ))}
    </div>
  );
}

/** 칸 높이 104 하나 — 폭으로 갈리지 않는다. 화면 높이로 채우지 않는다(I-09 16 · 17) */
const CELL_HEIGHT = "h-[104px]";

interface IProps {
  singleDayEvents: IEvent[];
  multiDayEvents: IEvent[];
  /** 칩을 누르면 그 일정 상세(지금은 팝오버) */
  onEventClick: (event: IEvent, el: HTMLElement) => void;
}

function MonthGrid({ singleDayEvents, multiDayEvents, onEventClick }: IProps) {
  const { t } = useTranslation("calendar");
  const { selectedDate, setSelectedDate } = useCalendar();
  const { startSelection, updateSelection, endSelection, isDateInSelection } =
    useDragSelect();
  const { metrics, stackRef, chipRef, moreRef } =
    useChipMetrics(DESKTOP_METRICS);

  const single = singleDayEvents.filter((e) => e.sourceType !== "expense");
  const multi = multiDayEvents.filter((e) => e.sourceType !== "expense");
  const all = [...multi, ...single];

  const holidays = new Set<string>();
  for (const e of all)
    if (e.sourceType === "holiday")
      holidays.add(startOfDay(parseISO(e.startDate)).toISOString());

  const cells = getCalendarCells(selectedDate);
  const positions = calculateMonthEventPositions(
    [...multi],
    [...single],
    selectedDate,
  );
  const model = buildMonthModel(cells, all, positions, metrics);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, date: Date) => {
      if (e.button !== 0) return;
      // 숫자 단추 · 칩 위에서는 끌기를 시작하지 않는다
      const target = e.target as HTMLElement;
      if (target.closest("button") || target.closest('[role="button"]')) return;
      startSelection(date);
    },
    [startSelection],
  );

  return (
    <Card
      data-slot="calendar-month-grid"
      className="p-0"
      onMouseUp={endSelection}
      onMouseLeave={endSelection}
    >
      <WeekdayHead />
      <div
        role="group"
        aria-label={formatYearMonth(selectedDate)}
        className="relative grid grid-cols-7"
      >
        {/* 칩 · "+N개" 한 줄의 실제 높이를 재는 보이지 않는 견본 */}
        <div
          aria-hidden
          className="pointer-events-none invisible absolute left-0 top-0 w-full"
        >
          <div
            ref={chipRef}
            className="block min-h-x5 px-x1_5 py-x0_5 text-t2 font-medium"
          >
            &nbsp;
          </div>
          <div ref={moreRef} className="pt-x0_5 text-t2 font-bold">
            &nbsp;
          </div>
        </div>
        {model.map(({ cell, slots, hidden, total }, index) => {
          const { date, day, currentMonth } = cell;
          const sunday = getDay(date) === 0;
          const saturday = getDay(date) === 6;
          const holiday = holidays.has(startOfDay(date).toISOString());
          const today = isToday(date);
          const selected = isSameDay(date, selectedDate);
          const dragging = isDateInSelection(date);
          const dateLabel = formatMonthDayWeekday(date);
          const lastRow = index >= model.length - 7;
          return (
            <div
              key={date.toISOString()}
              data-slot="month-cell"
              data-selected={selected ? "" : undefined}
              onMouseDown={(e) => handleMouseDown(e, date)}
              onMouseEnter={() => updateSelection(date)}
              className={cn(
                "relative flex min-w-0 select-none flex-col pt-x1",
                CELL_HEIGHT,
                !lastRow && "border-b border-stroke-neutral-subtle",
                index % 7 !== 6 && "border-r border-stroke-neutral-subtle",
                (selected || dragging) && "bg-bg-brand-weak",
              )}
            >
              <button
                type="button"
                aria-pressed={selected}
                aria-current={today ? "date" : undefined}
                aria-label={
                  total > 0
                    ? t("monthView.cellLabel", {
                        date: dateLabel,
                        count: total,
                      })
                    : t("monthView.cellLabelEmpty", { date: dateLabel })
                }
                onClick={() => setSelectedDate(date)}
                data-slot="month-day-number"
                className={cn(
                  // 원 26(글자 13/18 + 8) — 글자가 커지면 원도 따라 커진다. 왼쪽 6 · 아래 2
                  "mb-x0_5 ml-x1_5 grid size-[calc(var(--text-t3--line-height)+8px)] shrink-0 place-items-center self-start rounded-full text-t3 font-medium tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus-ring",
                  selected
                    ? "bg-bg-neutral-inverted font-bold text-fg-neutral-inverted"
                    : cn(
                        !currentMonth
                          ? "text-fg-disabled"
                          : holiday || sunday
                            ? "text-fg-critical"
                            : saturday
                              ? "text-fg-brand"
                              : "text-fg-neutral",
                        today && "bg-bg-neutral-weak font-bold",
                      ),
                )}
              >
                {day}
              </button>
              <div
                ref={index === 0 ? stackRef : undefined}
                className="mx-x1 flex min-h-0 flex-1 flex-col gap-x0_5"
              >
                {slots.map((slot, i) =>
                  slot ? (
                    <MonthChip
                      key={i}
                      slot={slot}
                      density="wide"
                      onClick={onEventClick}
                    />
                  ) : (
                    <MonthChipSpacer key={i} density="wide" />
                  ),
                )}
                {hidden > 0 && <MonthMore count={hidden} density="wide" />}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/**
 * 데스크톱 · 태블릿 월 격자 (I-09 16) — ds Card(모서리 16 · 1px · 안 여백 0) 안에 요일 머리 36 + 칸 104.
 * 칸 = 오른쪽 · 아래 1px 선. 날 숫자 원 26 왼쪽 맞춤, 칩 20 · 말줄임 · 시각 없음, "+N개" 는 칩 자리 마지막 줄.
 * 고른 날 = 칸 `bg-brand-weak` + 짙은 원. 누름 = 날 고르기, 두 날 이상 끌어 놓음 = 그 기간으로 일정 폼.
 */
export function CalendarMonthViewDesktop(props: IProps) {
  const { setSelectedDate } = useCalendar();
  return (
    <DragSelectProvider onSelectDay={setSelectedDate}>
      <MonthGrid {...props} />
    </DragSelectProvider>
  );
}
