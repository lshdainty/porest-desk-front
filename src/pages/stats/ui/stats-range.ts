import {
  formatYearMonth,
  formatYear,
  formatYearQuarter,
} from "@/shared/lib/date";

export type TabKey = "cat" | "trend" | "compare" | "fixed";
export type SegMode = "m" | "q" | "y" | "custom";
export type RangeState = { from: Date; to: Date; segMode: SegMode };

export const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const fmt = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const monthRangeOf = (now: Date): RangeState => ({
  from: new Date(now.getFullYear(), now.getMonth(), 1),
  to: new Date(now.getFullYear(), now.getMonth() + 1, 0),
  segMode: "m",
});
export const quarterRangeOf = (now: Date): RangeState => {
  const q = Math.floor(now.getMonth() / 3);
  return {
    from: new Date(now.getFullYear(), q * 3, 1),
    to: new Date(now.getFullYear(), q * 3 + 3, 0),
    segMode: "q",
  };
};
export const yearRangeOf = (now: Date): RangeState => ({
  from: new Date(now.getFullYear(), 0, 1),
  to: new Date(now.getFullYear(), 11, 31),
  segMode: "y",
});

const sameDayAs = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/**
 * 달력에서 고른 기간이 어떤 보기인가 — 지금 기간 그대로면 보기를 지키고, 바뀌었으면 한 달 · 한 분기 · 한 해를
 * 정확히 채운 기간은 그 보기(월 · 분기 · 년)로, 나머지는 직접(custom)으로 센다.
 * (옛 시트의 월 · 분기 · 년 탭이 하던 일 — 전월 비교 · 일 평균 · 기간 이름이 이 값을 따른다)
 */
export const rangeSegModeOf = (
  from: Date,
  to: Date,
  current: RangeState,
): SegMode => {
  if (sameDayAs(from, current.from) && sameDayAs(to, current.to))
    return current.segMode;
  const spans = (r: RangeState) =>
    sameDayAs(from, r.from) && sameDayAs(to, r.to);
  if (spans(monthRangeOf(from))) return "m";
  if (spans(quarterRangeOf(from))) return "q";
  if (spans(yearRangeOf(from))) return "y";
  return "custom";
};

export const previousRange = ({
  from,
  to,
  segMode,
}: RangeState): { from: Date; to: Date } => {
  if (segMode === "m") {
    return {
      from: new Date(from.getFullYear(), from.getMonth() - 1, 1),
      to: new Date(from.getFullYear(), from.getMonth(), 0),
    };
  }
  if (segMode === "q") {
    return {
      from: new Date(from.getFullYear(), from.getMonth() - 3, 1),
      to: new Date(from.getFullYear(), from.getMonth(), 0),
    };
  }
  if (segMode === "y") {
    return {
      from: new Date(from.getFullYear() - 1, 0, 1),
      to: new Date(from.getFullYear() - 1, 11, 31),
    };
  }
  // custom: 같은 길이 직전 윈도우
  const days =
    Math.round(
      (startOfDay(to).getTime() - startOfDay(from).getTime()) / 86400000,
    ) + 1;
  const t = new Date(from);
  t.setDate(t.getDate() - 1);
  const f = new Date(t);
  f.setDate(f.getDate() - days + 1);
  return { from: f, to: t };
};

export const periodLabel = ({ from, to, segMode }: RangeState): string => {
  if (segMode === "m") return formatYearMonth(from);
  if (segMode === "q") return formatYearQuarter(from);
  if (segMode === "y") return formatYear(from);
  const sameYear = from.getFullYear() === to.getFullYear();
  return sameYear
    ? `${from.getMonth() + 1}/${from.getDate()} ~ ${to.getMonth() + 1}/${to.getDate()}`
    : `${fmt(from)} ~ ${fmt(to)}`;
};

export const labelsOf = ({ segMode }: RangeState) =>
  segMode === "m"
    ? {
        now: "period.m.now",
        prev: "period.m.prev",
        mom: "period.m.mom",
        noPrev: "period.m.noPrev",
        avg: "period.m.avg",
      }
    : segMode === "q"
      ? {
          now: "period.q.now",
          prev: "period.q.prev",
          mom: "period.q.mom",
          noPrev: "period.q.noPrev",
          avg: "period.q.avg",
        }
      : segMode === "y"
        ? {
            now: "period.y.now",
            prev: "period.y.prev",
            mom: "period.y.mom",
            noPrev: "period.y.noPrev",
            avg: "period.y.avg",
          }
        : {
            now: "period.custom.now",
            prev: "period.custom.prev",
            mom: "period.custom.mom",
            noPrev: "period.custom.noPrev",
            avg: "period.custom.avg",
          };
