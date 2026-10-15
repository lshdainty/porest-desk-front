/*
 * Porest Date Picker 의 날짜 도구 · 글 · 값 — 수치 원본은 porest-design specs/components/date-picker.yaml
 * (값은 src/shared/ds/spec/date-picker.json). 컴포넌트는 date-picker.tsx 다(컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
 *
 * 날짜는 모두 **로컬 시간대의 그 날 0시** Date 로 다룬다 — 시간은 보지 않는다. 문자열("YYYY-MM-DD")을 Date 로 만들 때
 * new Date("2026-10-01") 은 UTC 0시로 읽혀 UTC+9 에서도 같은 날이지만 UTC−x 에서는 하루 전이 된다 — 그래서 여기서는
 * 연 · 월 · 일 숫자로 만들고(new Date(y, m, d)), 문자열 키는 로컬 연 · 월 · 일에서 만든다(dayKey). 달 더하기 · 일 더하기는
 * 시 · 분이 아니라 날짜 칸을 움직여 서머타임 · 윤년에도 같은 날 0시에 닿는다.
 */

// ── 날짜 도구 ─────────────────────────────────────────────────
export const pad2 = (n: number) => String(n).padStart(2, "0");
export const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const daysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();
export const monthStart = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), 1);
/** 한 달 · 한 해 옮기기 — 같은 날, 없으면 그 달 말일(1월 31일 + 1달 = 2월 28일 · 윤년 29일) */
export const addMonths = (d: Date, n: number) => {
  const first = new Date(d.getFullYear(), d.getMonth() + n, 1);
  return new Date(
    first.getFullYear(),
    first.getMonth(),
    Math.min(d.getDate(), daysInMonth(first.getFullYear(), first.getMonth())),
  );
};
export const compareDay = (a: Date, b: Date) =>
  a.getFullYear() - b.getFullYear() ||
  a.getMonth() - b.getMonth() ||
  a.getDate() - b.getDate();
export const sameDay = (a: Date | undefined, b: Date | undefined) =>
  !!a && !!b && compareDay(a, b) === 0;
export const monthNumber = (d: Date) => d.getFullYear() * 12 + d.getMonth();
export const fromMonthNumber = (n: number) =>
  new Date(Math.floor(n / 12), ((n % 12) + 12) % 12, 1);
/** 로컬 연 · 월 · 일의 "YYYY-MM-DD" — UTC 가 아니다(toISOString 을 쓰지 않는다) */
export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
/** "YYYY-MM-DD" → 로컬 그 날 0시. 틀린 글이면 undefined */
export function parseDayKey(key: string): Date | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return undefined;
  const [y, mo, d] = [Number(m[1]), Number(m[2]) - 1, Number(m[3])];
  const date = new Date(y, mo, d);
  return date.getFullYear() === y &&
    date.getMonth() === mo &&
    date.getDate() === d
    ? date
    : undefined;
}
/** 주는 일요일부터 */
export const weekStart = (d: Date) => addDays(d, -d.getDay());
export const weekEnd = (d: Date) => addDays(d, 6 - d.getDay());
/** 그 달의 주 수 — 4 ~ 6 */
export const weeksInMonth = (year: number, month: number) =>
  Math.ceil((new Date(year, month, 1).getDay() + daysInMonth(year, month)) / 7);
export const clampDay = (d: Date, min: Date, max: Date) =>
  compareDay(d, min) < 0 ? min : compareDay(d, max) > 0 ? max : d;

// ── 빠른 기간 ─────────────────────────────────────────────────
export type DatePresetName =
  | "thisWeek"
  | "thisMonth"
  | "lastMonth"
  | "last7Days"
  | "last30Days"
  | "last3Months"
  | "last6Months"
  | "last1Year"
  | "thisYear";

/** 빠른 기간 이름 — date-picker.md "빠른 기간" 의 순서 */
export const DATE_PRESETS: readonly DatePresetName[] = [
  "thisWeek",
  "thisMonth",
  "lastMonth",
  "last7Days",
  "last30Days",
  "last3Months",
  "last6Months",
  "last1Year",
  "thisYear",
];

export interface DateRange {
  start?: Date;
  end?: Date;
}

/**
 * 빠른 기간의 범위 — 달력 단위(끝은 그 단위의 마지막 날, 앞으로의 날도 든다), 주는 일요일부터. today 는 오늘(기본 지금).
 * 이번 달을 넣은 n 달은 n − 1 달 전 1일 ~ 이번 달 말일이다(연초 · 윤년 2월 · 월말에도 달력 날짜로 셈한다).
 */
export function getPresetRange(
  name: DatePresetName,
  today: Date = new Date(),
): { start: Date; end: Date } {
  const t = startOfDay(today);
  const y = t.getFullYear();
  const m = t.getMonth();
  const months = (n: number) => ({
    start: new Date(y, m - (n - 1), 1),
    end: new Date(y, m + 1, 0),
  });
  switch (name) {
    case "thisWeek":
      return { start: weekStart(t), end: weekEnd(t) };
    case "thisMonth":
      return months(1);
    case "lastMonth":
      return { start: new Date(y, m - 1, 1), end: new Date(y, m, 0) };
    case "last7Days":
      return { start: addDays(t, -6), end: t };
    case "last30Days":
      return { start: addDays(t, -29), end: t };
    case "last3Months":
      return months(3);
    case "last6Months":
      return months(6);
    case "last1Year":
      return months(12);
    case "thisYear":
      return { start: new Date(y, 0, 1), end: new Date(y, 11, 31) };
  }
}

// ── 글 ───────────────────────────────────────────────────────
export interface DatePickerLabels {
  /** 달력 이름 — 칸 라벨이 없을 때 */
  root: string;
  previousMonth: string;
  nextMonth: string;
  /** 연 · 월 휠의 칼럼 이름 */
  yearWheel: string;
  monthWheel: string;
  /** 읽기 전용 시작일 이름 끝에 붙는 말 */
  readOnlyRangeStart: string;
  /** 빠른 기간 칩 묶음 이름 */
  presets: string;
  /** 보이는 요일(일요일부터 일곱) */
  weekdays: readonly string[];
  /** 읽는 요일(일요일부터 일곱) */
  weekdaysLong: readonly string[];
  /** 달 제목 · 알림 — month 는 1 ~ 12 */
  month: (year: number, month: number) => string;
  /** 날짜 버튼 이름 */
  day: (date: Date) => string;
  /** 연 · 월 휠 항목 */
  yearOption: (year: number) => string;
  monthOption: (month: number) => string;
  /** 빠른 기간 칩 글 */
  presetNames: Record<DatePresetName, string>;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;
const WEEKDAYS_LONG = [
  "일요일",
  "월요일",
  "화요일",
  "수요일",
  "목요일",
  "금요일",
  "토요일",
] as const;

/** 한국어 글 한 벌 — 다른 언어는 같은 꼴로 labels 에 넘긴다 */
export const DATE_PICKER_LABELS: DatePickerLabels = {
  root: "날짜 선택",
  previousMonth: "이전 달",
  nextMonth: "다음 달",
  yearWheel: "연도",
  monthWheel: "월",
  readOnlyRangeStart: "읽기 전용 시작일",
  presets: "빠른 기간",
  weekdays: WEEKDAYS,
  weekdaysLong: WEEKDAYS_LONG,
  month: (year, month) => `${year}년 ${month}월`,
  day: (d) =>
    `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAYS_LONG[d.getDay()]}`,
  yearOption: (year) => `${year}년`,
  monthOption: (month) => `${month}월`,
  presetNames: {
    thisWeek: "이번 주",
    thisMonth: "이번 달",
    lastMonth: "지난 달",
    last7Days: "최근 7일",
    last30Days: "최근 30일",
    last3Months: "최근 3개월",
    last6Months: "최근 6개월",
    last1Year: "최근 1년",
    thisYear: "올해",
  },
};

/** 칸에 넣는 하루 — 올해 "10월 15일 (목)", 다른 해 "2027년 1월 3일 (일)". 비었으면 "" */
export function formatDateValue(
  date: Date | undefined | null,
  today: Date = new Date(),
): string {
  if (!date) return "";
  const text = `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`;
  return date.getFullYear() === today.getFullYear()
    ? text
    : `${date.getFullYear()}년 ${text}`;
}

/**
 * 칸에 넣는 기간 — "10월 1일~10월 31일"(물결표를 앞뒤에 붙여 쓴다 — International Design). 올해가 아닌 날이 끼면(두 해에 걸치거나
 * 다른 해) 양쪽에 연도("2026년 12월 28일~2027년 1월 3일"). 끝이 없으면 ""
 */
export function formatRangeValue(
  range: DateRange | undefined | null,
  today: Date = new Date(),
): string {
  if (!range?.start || !range.end) return "";
  const year = today.getFullYear();
  const withYear =
    range.start.getFullYear() !== year || range.end.getFullYear() !== year;
  const text = (d: Date) =>
    `${withYear ? `${d.getFullYear()}년 ` : ""}${d.getMonth() + 1}월 ${d.getDate()}일`;
  return `${text(range.start)}~${text(range.end)}`;
}

/** 이어지는 달 스크롤에서 위치가 든 달 — 정렬된 위치 목록에서 이진 탐색 */
export function monthAt(
  offsets: readonly number[],
  heights: readonly number[],
  offset: number,
) {
  let low = 0;
  let high = offsets.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const top = offsets[mid] ?? 0;
    if (offset < top) high = mid - 1;
    else if (offset >= top + (heights[mid] ?? 0)) low = mid + 1;
    else return mid;
  }
  return Math.min(Math.max(low, 0), Math.max(offsets.length - 1, 0));
}
