/*
 * 달력 격자 계산 — 가계부 작은 달력 · 태블릿 주 달력과 할 일 작은 달력 · 주 달력이 같이 쓴다(I-07 26 · 27 · I-10 27 · 28).
 * 화면이 아니라 날짜 셈이라 한 곳에 둔다.
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

/** 오늘이 든 주(보이는 달 밖이면 첫 주) — 주 달력이 접힌 채 보이는 줄 */
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

/** 오늘 "yyyy-MM-dd" */
export function todayKey(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}
