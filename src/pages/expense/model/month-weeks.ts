/**
 * 폰 가계부 달력의 주 계산 — 실제 달력과 첫 진입 스켈레톤이 **같이** 쓴다(같은 셈을 두 번 쓰면 월초 · 월말 주와 `?month=` 에서 갈린다).
 * 한 달을 일요일 시작 7칸 주로 나누고, 달 밖 자리는 `null`(빈 칸 — 숫자를 그리지 않는다).
 */
export type MonthCell = { d: number; ds: string } | null;

const pad = (n: number) => String(n).padStart(2, "0");

/** `YYYY-MM-DD` — 기기 시계의 날 */
export function dayKeyOf(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** `YYYY-MM` 한 달의 주들 */
export function monthWeeks(month: string): MonthCell[][] {
  const [y = 0, m = 1] = month.split("-").map(Number);
  const firstDow = new Date(y, m - 1, 1).getDay();
  const dim = new Date(y, m, 0).getDate();
  const cells: MonthCell[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push({ d, ds: `${month}-${pad(d)}` });
  while (cells.length % 7) cells.push(null);
  const out: MonthCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7));
  return out;
}

/** 접힌 달력이 보여 줄 주 — 고른 날의 주, 없으면 오늘의 주, 없으면 첫 주 */
export function pickWeek(
  weeks: MonthCell[][],
  selected: string | null,
  todayStr: string,
): number {
  const has = (ds: string | null) =>
    ds ? weeks.findIndex((w) => w.some((c) => c && c.ds === ds)) : -1;
  const sel = has(selected);
  if (sel >= 0) return sel;
  const today = has(todayStr);
  return today >= 0 ? today : 0;
}
