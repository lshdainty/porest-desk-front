// 앱과 공용인 줄 번호 표본 (I-09 10) — 같은 입력에 웹 `calculateMonthEventPositions` 와 앱이 같은 줄 번호를 내는지 본다.
// 표본 원본: ~/qa/design-work/impl-audit/instructions/I-09-1-position-fixture.json (앱 `calculateMonthPositions` 와 같은 파일).
import { isSameDay, parseISO } from "date-fns";
import { describe, expect, it } from "vitest";

import type { IEvent } from "@/widgets/calendar/model/interfaces";
import {
  buildMonthModel,
  type ChipMetrics,
} from "@/widgets/calendar/ui/month-view/month-model";
import {
  calculateMonthEventPositions,
  convertHolidayToIEvent,
  getCalendarCells,
  getEventUniqueKey,
} from "./helpers";
import fixture from "./__fixtures__/position-fixture.json";

type Item = (typeof fixture.items)[number];

const toEvent = (it: Item): IEvent =>
  it.holiday
    ? {
        ...convertHolidayToIEvent({
          rowId: 0,
          holidayDate: it.startDate.slice(0, 10),
          holidayName: it.title,
          holidayType: "PUBLIC",
        } as never),
        id: it.id as unknown as number,
      }
    : ({
        id: it.id as unknown as number,
        startDate: it.startDate,
        endDate: it.endDate,
        title: it.title,
        description: "",
        color: "#2c70bf",
        isAllDay: it.isAllDay,
        sourceType: "calendar",
        eventType: null,
        calendarRowId: 1,
        calendarName: null,
        calendarColor: null,
        labelRowId: null,
        labelName: null,
        labelColor: null,
        location: null,
        rrule: null,
        recurrenceId: null,
        reminders: [],
      } as IEvent);

const events = fixture.items.map(toEvent);
// `use-calendar-screen` 의 갈래와 같다 — 종일은 모두 여러 날 쪽, 시각 있는 하루짜리만 하루 쪽
const single = events.filter(
  (e) => !e.isAllDay && isSameDay(parseISO(e.startDate), parseISO(e.endDate)),
);
const multi = events.filter(
  (e) => e.isAllDay || !isSameDay(parseISO(e.startDate), parseISO(e.endDate)),
);
const selected = new Date(fixture.month.year, fixture.month.month - 1, 1);

describe("줄 번호 공용 표본", () => {
  it("웹 calculateMonthEventPositions 가 표본의 기대 줄 번호와 모두 같다", () => {
    const positions = calculateMonthEventPositions(
      [...multi],
      [...single],
      selected,
    );
    // 키 모양도 표본과 같다
    expect(fixture.keyFormat).toBe("{id}-{startDate}");
    expect(events.map(getEventUniqueKey).sort()).toEqual(
      Object.keys(fixture.expectedPositions).sort(),
    );
    expect(positions).toEqual(fixture.expectedPositions);
  });

  it("칸이 넉넉하면 칸마다 buildMonthModel 의 줄(slot) 번호가 그 줄 번호 그대로다", () => {
    const positions = calculateMonthEventPositions(
      [...multi],
      [...single],
      selected,
    );
    const roomy: ChipMetrics = { avail: 2000, chip: 18, more: 16, gap: 2 };
    const model = buildMonthModel(
      getCalendarCells(selected),
      events,
      positions,
      roomy,
    );
    let seen = 0;
    for (const cell of model) {
      cell.slots.forEach((slot, row) => {
        if (!slot) return;
        seen += 1;
        expect(row).toBe(
          fixture.expectedPositions[
            getEventUniqueKey(
              slot.event,
            ) as keyof typeof fixture.expectedPositions
          ],
        );
      });
      expect(cell.hidden).toBe(0);
    }
    expect(seen).toBeGreaterThan(events.length);
  });
});
