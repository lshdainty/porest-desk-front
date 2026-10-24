import { heatStep } from "@/shared/ds/chart";
import type { Expense } from "@/entities/expense";
import { countableTx } from "@/entities/expense";
import { dayKey } from "./ledger-data";

/*
 * 데스크톱 작은 달력 · 태블릿 주 달력의 계산 — 화면 파일에서 떼어 순수 함수로 둔다(I-07 26 · 27).
 */

const pad2 = (n: number) => String(n).padStart(2, "0");

/** 달력 한 칸 — 6주 42칸 고정. 앞뒤 달 칸은 `inMonth` 가 false(누르지 못한다) */
export interface CalendarDay {
  /** "yyyy-MM-dd" */
  ds: string;
  day: number;
  inMonth: boolean;
}

/** 그 달 6주 × 7일 — 일요일 시작. 앞뒤 달 칸도 날짜를 채운다(date-picker 결정 "앞뒤 달 흐리게 6주") */
export function monthGrid(month: string): CalendarDay[][] {
  const [y = 1970, m = 1] = month.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const start = new Date(y, m - 1, 1 - first.getDay());
  const weeks: CalendarDay[][] = [];
  for (let w = 0; w < 6; w++) {
    const row: CalendarDay[] = [];
    for (let d = 0; d < 7; d++) {
      const dt = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate() + w * 7 + d,
      );
      row.push({
        ds: `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`,
        day: dt.getDate(),
        inMonth: dt.getFullYear() === y && dt.getMonth() === m - 1,
      });
    }
    weeks.push(row);
  }
  return weeks;
}

/** 날마다 지출 · 수입 — 서버 집계와 같은 셈(환불된 것 · 예정은 `countableTx` 가 뺀다, 이체는 거래가 아니라 안 센다) */
export function dailyTotals(
  expenses: Expense[],
): Record<string, { out: number; inn: number }> {
  const byDay: Record<string, { out: number; inn: number }> = {};
  for (const e of countableTx(expenses)) {
    const k = dayKey(e.expenseDate);
    const cur = (byDay[k] ??= { out: 0, inn: 0 });
    if (e.expenseType === "EXPENSE") cur.out += Math.abs(e.amount);
    else cur.inn += Math.abs(e.amount);
  }
  return byDay;
}

/** 그 달 지출이 가장 큰 날의 값 — 세기 막대를 끊는 기준(열지도 규칙 8 · 22 · 45 · 75%) */
export function maxDailyOut(
  byDay: Record<string, { out: number; inn: number }>,
  month: string,
): number {
  let max = 0;
  for (const [ds, v] of Object.entries(byDay)) {
    if (ds.startsWith(month) && v.out > max) max = v.out;
  }
  return max;
}

/** 지출 → 막대 세기 0 ~ 4(없으면 -1). 열지도와 같은 끊는 자리 */
export const barStep = (out: number, max: number): number => heatStep(out, max);

/** 막대 진하기 — 열지도 세기 다섯(18 · 35 · 55 · 76 · 100%) */
export const BAR_OPACITY = [0.18, 0.35, 0.55, 0.76, 1] as const;

/** 오늘이 든 주(보이는 달 밖이면 첫 주) — 태블릿 주 달력이 접힌 채 보이는 줄 */
export function visibleWeekIndex(
  weeks: CalendarDay[][],
  today: string,
): number {
  const i = weeks.findIndex((w) => w.some((c) => c.inMonth && c.ds === today));
  return i < 0 ? 0 : i;
}

/** "yyyy-MM" 을 delta 달 옮긴다 */
export function shiftMonth(month: string, delta: number): string {
  const [y = 1970, m = 1] = month.split("-").map(Number);
  const dt = new Date(y, m - 1 + delta, 1);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}`;
}

/** 달 키를 [first, last] 안으로 민다 — 기간이 걸렸을 때 작은 달력이 기간 밖으로 못 나가게(Q5-C) */
export function clampMonth(
  month: string,
  bounds: { first: string; last: string } | null,
): string {
  if (!bounds) return month;
  if (month < bounds.first) return bounds.first;
  if (month > bounds.last) return bounds.last;
  return month;
}

/** 오늘 "yyyy-MM-dd" */
export function todayKey(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}
