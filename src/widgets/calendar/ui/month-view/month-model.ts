import {
  differenceInCalendarDays,
  endOfDay,
  getDay,
  isSameDay,
  parseISO,
  startOfDay,
} from "date-fns";

import {
  getEventUniqueKey,
  getMonthCellEvents,
} from "@/widgets/calendar/lib/helpers";
import type {
  ICalendarCell,
  IEvent,
} from "@/widgets/calendar/model/interfaces";

/*
 * 월 격자 모델 (I-09 10 · 16) — 칸마다 "어떤 줄에 어떤 칩이 서고, 몇 개가 접히는가" 를 정한다.
 * 보이는 칩 수는 상수가 아니라 실제로 잰 크기(칸 안 칩 자리 높이 · 칩 높이 · "+N개" 높이)로 센다 —
 * 글자가 커지면 칩이 커지고 보이는 수가 줄며 "+N개" 가 는다.
 */

/** 칸 안 칩 자리의 실측 — 모두 px */
export interface ChipMetrics {
  /** 칩 자리(날 숫자 아래 ~ 칸 아래) 높이 */
  avail: number;
  /** 칩 한 줄 높이 */
  chip: number;
  /** "+N개" 줄 높이 */
  more: number;
  /** 줄 사이 */
  gap: number;
}

/**
 * `rows` 줄이 필요한 칸에서 칩 몇 줄을 그리고 "+N개" 를 둘지 정한다.
 * 다 들어가면 칩만. 아니면 마지막 줄을 "+N개" 가 차지한다 — 칩 n 줄 + 사이 + "+N개" 가 칩 자리에 들어가는 가장 큰 n.
 */
export function planSlots(
  rows: number,
  m: ChipMetrics,
): { shown: number; more: boolean } {
  if (rows <= 0) return { shown: 0, more: false };
  const all = rows * m.chip + (rows - 1) * m.gap;
  if (all <= m.avail) return { shown: rows, more: false };
  const n = Math.max(0, Math.floor((m.avail - m.more) / (m.chip + m.gap)));
  return { shown: Math.min(n, rows), more: true };
}

export type ChipPart = "none" | "first" | "middle" | "last";

export interface ChipSlot {
  event: IEvent;
  part: ChipPart;
  /** 이 칸이 이 행에서 이어진 띠의 제목을 그리는 칸이면 띠가 차지하는 칸 수(아니면 0) */
  labelDays: number;
}

export interface CellModel {
  cell: ICalendarCell;
  /** 위치(줄) 차례의 칩 — 비어 있는 줄은 null(띠가 줄을 맞추려고 비워 둔다) */
  slots: (ChipSlot | null)[];
  /** 접힌 일정 수("+N개") — 0 이면 "+N개" 줄 없음 */
  hidden: number;
  /** 이 칸에 걸린 일정 수 */
  total: number;
}

function partOf(event: IEvent, cellDate: Date): ChipPart {
  const start = startOfDay(parseISO(event.startDate));
  const end = endOfDay(parseISO(event.endDate));
  if (isSameDay(start, end)) return "none";
  if (isSameDay(cellDate, start)) return "first";
  if (isSameDay(cellDate, startOfDay(parseISO(event.endDate)))) return "last";
  return "middle";
}

export function buildMonthModel(
  cells: ICalendarCell[],
  events: IEvent[],
  positions: Record<string, number>,
  metrics: ChipMetrics,
): CellModel[] {
  const base = cells.map((cell) => {
    const day = startOfDay(cell.date);
    const here = getMonthCellEvents(cell.date, events, positions)
      .filter((e) => e.position >= 0)
      .filter((e) => {
        const s = startOfDay(parseISO(e.startDate));
        const en = endOfDay(parseISO(e.endDate));
        return day >= s && day <= en;
      });
    const rows = here.reduce((n, e) => Math.max(n, e.position + 1), 0);
    const plan = planSlots(rows, metrics);
    const slots: (ChipSlot | null)[] = Array.from(
      { length: plan.shown },
      () => null,
    );
    let hidden = 0;
    for (const e of here) {
      if (e.position < plan.shown)
        slots[e.position] = { event: e, part: partOf(e, day), labelDays: 0 };
      else hidden += 1;
    }
    return { cell, slots, hidden, total: here.length } satisfies CellModel;
  });

  // 이어지는 일정의 제목은 행(주)마다 한 번, 그 행에서 띠가 처음 보이는 칸에 그린다 —
  // 첫 칸에서 접혔어도 뒤 칸에 보이는 조각에 제목이 남는다.
  for (let row = 0; row * 7 < base.length; row += 1) {
    const week = base.slice(row * 7, row * 7 + 7);
    const hosted = new Set<string>();
    week.forEach((c, i) => {
      for (const slot of c.slots) {
        if (!slot || slot.part === "none") continue;
        const key = getEventUniqueKey(slot.event);
        if (hosted.has(key)) continue;
        hosted.add(key);
        const end = startOfDay(parseISO(slot.event.endDate));
        slot.labelDays = Math.min(
          differenceInCalendarDays(end, startOfDay(c.cell.date)) + 1,
          7 - getDay(c.cell.date),
          7 - i,
        );
      }
    });
  }
  return base;
}
