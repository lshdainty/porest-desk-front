import { heatStep } from "@/shared/ds/chart";
import type { Expense } from "@/entities/expense";
import { countableTx } from "@/entities/expense";
import { dayKey } from "./ledger-data";

/*
 * 데스크톱 작은 달력 · 태블릿 주 달력의 계산 — 화면 파일에서 떼어 순수 함수로 둔다(I-07 26 · 27).
 */

export {
  monthGrid,
  shiftMonth,
  todayKey,
  visibleWeekIndex,
  type CalendarDay,
} from "@/shared/lib/groo/calendar-grid";

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
