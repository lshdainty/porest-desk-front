import { describe, expect, it } from "vitest";

import {
  calculateMonthEventPositions,
  getCalendarCells,
} from "@/widgets/calendar/lib/helpers";
import type { IEvent } from "@/widgets/calendar/model/interfaces";
import { buildMonthModel, planSlots, type ChipMetrics } from "./month-model";

// 글자 100% 의 폰 칸(103) 값 — 칩 자리 73 · 칩 18 · "+N개" 16 · 사이 2
const PHONE: ChipMetrics = { avail: 73, chip: 18, more: 16, gap: 2 };
// 글자 200% — 칩이 두 배로 커지고 칩 자리는 그대로(칸 103)
const PHONE_200: ChipMetrics = { avail: 47, chip: 36, more: 32, gap: 2 };

describe("planSlots — 보이는 칩 수를 잰 크기로 센다", () => {
  it("칸 103 · 100%: 칩 셋까지는 다 보인다", () => {
    expect(planSlots(3, PHONE)).toEqual({ shown: 3, more: false });
  });

  it('넷 이상이면 칩 둘 + 마지막 줄을 "+N개" 가 차지한다', () => {
    expect(planSlots(4, PHONE)).toEqual({ shown: 2, more: true });
    expect(planSlots(5, PHONE)).toEqual({ shown: 2, more: true });
  });

  it("글자 200% 에서는 보이는 칩이 줄고 접힌 수가 는다 — 칸은 그대로", () => {
    expect(planSlots(1, PHONE_200)).toEqual({ shown: 1, more: false });
    expect(planSlots(2, PHONE_200)).toEqual({ shown: 0, more: true });
    expect(planSlots(5, PHONE_200)).toEqual({ shown: 0, more: true });
  });

  it("칸에 걸린 것이 없으면 아무것도 두지 않는다", () => {
    expect(planSlots(0, PHONE)).toEqual({ shown: 0, more: false });
  });
});

const event = (
  id: number,
  day: number,
  over: Partial<IEvent> = {},
): IEvent => ({
  id,
  startDate: `2026-10-${String(day).padStart(2, "0")}T10:00:00`,
  endDate: `2026-10-${String(day).padStart(2, "0")}T11:00:00`,
  title: `일정 ${id}`,
  description: "",
  color: "#2c70bf",
  isAllDay: false,
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
  ...over,
});

const build = (events: IEvent[], metrics: ChipMetrics) => {
  const selected = new Date(2026, 9, 15);
  const cells = getCalendarCells(selected);
  const positions = calculateMonthEventPositions(
    events.filter((e) => e.startDate !== e.endDate && e.isAllDay),
    events.filter((e) => !(e.startDate !== e.endDate && e.isAllDay)),
    selected,
  );
  return buildMonthModel(cells, events, positions, metrics);
};
const cellOf = (model: ReturnType<typeof build>, day: number) =>
  model.find((m) => m.cell.currentMonth && m.cell.day === day)!;

describe("buildMonthModel — 22일 일정 다섯", () => {
  const five = [1, 2, 3, 4, 5].map((i) => event(i, 22));

  it('칩 둘 + "+3개"(100%)', () => {
    const c = cellOf(build(five, PHONE), 22);
    expect(c.slots.filter(Boolean)).toHaveLength(2);
    expect(c.hidden).toBe(3);
    expect(c.total).toBe(5);
  });

  it('200% 에서는 칩이 없고 "+5개" 다', () => {
    const c = cellOf(build(five, PHONE_200), 22);
    expect(c.slots.filter(Boolean)).toHaveLength(0);
    expect(c.hidden).toBe(5);
  });

  it("일정이 몇 개든 칸 수 한도(3) 없이 위치를 받는다", () => {
    const six = [1, 2, 3, 4, 5, 6].map((i) => event(i, 22));
    const wide: ChipMetrics = { avail: 300, chip: 18, more: 16, gap: 2 };
    const c = cellOf(build(six, wide), 22);
    expect(c.slots.filter(Boolean)).toHaveLength(6);
    expect(c.hidden).toBe(0);
  });
});

describe("buildMonthModel — 이어지는 일정", () => {
  it("주를 넘기는 띠는 행마다 한 번, 그 행에서 띠가 처음 보이는 칸에 제목을 둔다", () => {
    // 16(금) ~ 19(월): 16 · 17 은 한 주, 18 · 19 는 다음 주
    const bar = event(1, 16, {
      isAllDay: true,
      startDate: "2026-10-16T00:00:00",
      endDate: "2026-10-19T23:59:59",
    });
    const model = build([bar], PHONE);
    const hosts = model.filter((m) =>
      m.slots.some((s) => s && s.labelDays > 0),
    );
    expect(hosts.map((m) => m.cell.day)).toEqual([16, 18]);
    expect(cellOf(model, 16).slots[0]!.labelDays).toBe(2); // 금 · 토
    expect(cellOf(model, 18).slots[0]!.labelDays).toBe(2); // 일 · 월
    expect(cellOf(model, 16).slots[0]!.part).toBe("first");
    expect(cellOf(model, 19).slots[0]!.part).toBe("last");
  });

  it("첫 칸에서 접혔으면 그 행의 다음 보이는 칸이 제목을 맡는다", () => {
    const bar = (id: number, from: number, to: number) =>
      event(id, from, {
        isAllDay: true,
        startDate: `2026-10-${from}T00:00:00`,
        endDate: `2026-10-${to}T23:59:59`,
      });
    // 긴 띠 둘(위치 0 · 1) 아래에 짧은 띠(위치 2)가 서고, 16 일에만 일정 둘이 더 붙어(위치 3 · 4) 그 칸만 접힌다
    const model = build(
      [
        bar(1, 16, 20),
        bar(2, 16, 20),
        bar(3, 16, 17),
        event(8, 16),
        event(9, 16),
      ],
      PHONE,
    );
    const short16 = cellOf(model, 16).slots.find((s) => s?.event.id === 3);
    const short17 = cellOf(model, 17).slots.find((s) => s?.event.id === 3);
    expect(short16).toBeUndefined(); // 16 일은 칩 둘 + "+N개" 로 접혀 짧은 띠가 안 보인다
    expect(short17!.labelDays).toBe(1); // 17(토) 이 그 행의 첫 보이는 칸이라 제목을 맡는다
  });
});
