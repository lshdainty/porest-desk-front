import type { ExpenseType } from "@/entities/expense";

/*
 * 거래 필터의 모양·기본값·평가 규칙 — 다이얼로그와 목록 화면이 함께 쓴다.
 *
 * 다이얼로그 파일에 두면 컴포넌트 아닌 것을 export 하게 되어 Fast Refresh 가
 * 그 파일의 상태를 매번 버린다(react-refresh/only-export-components).
 *
 * **앱(`filter_dialog.dart` · `expense_filter.dart`)이 이 규칙을 미러한다.**
 * 진리표는 양쪽이 같은 표를 쓴다 — 한쪽만 고치면 같은 필터가 두 화면에서 다른
 * 결과를 낸다.
 */

export type MatchMode = "all" | "any";
export type FilterPeriodPreset = "week" | "month" | "3m" | "custom";

/** 기간 한 칸. preset 이 custom 이 아니어도 start·end 를 계산해 채워 둔다. */
export interface FilterPeriodRange {
  preset: FilterPeriodPreset;
  /** "YYYY-MM-DD" */
  start: string;
  /** "YYYY-MM-DD" */
  end: string;
}

/** 칩 3상태 — 고르면 include, 한 번 더 누르면 exclude, 또 누르면 해제. */
export interface IncludeExclude {
  include: number[];
  exclude: number[];
}

/** 금액 구간 한 칸. 빈 문자열은 "제한 없음". */
export interface AmountRange {
  min: string;
  max: string;
}

export interface FilterValue {
  /** 포함 조건들을 모두 만족(all) / 하나라도 만족(any). 기간·제외는 항상 AND. */
  match: MatchMode;
  /** 1~3칸. 칸 사이는 OR 이고, 기간 자체는 **항상** 다른 조건과 AND 다. */
  periods: FilterPeriodRange[];
  types: ExpenseType[];
  categories: IncludeExclude;
  assets: IncludeExclude;
  /** 0~3칸, 칸 사이 OR. */
  amountRanges: AmountRange[];
}

export const MAX_PERIODS = 3;
export const MAX_AMOUNT_RANGES = 3;

export const DEFAULT_FILTER: FilterValue = {
  match: "all",
  periods: [],
  types: ["EXPENSE", "INCOME"],
  categories: { include: [], exclude: [] },
  assets: { include: [], exclude: [] },
  amountRanges: [],
};

/**
 * 필터가 판정하는 한 줄. 거래와 이체를 **같은 모양으로** 눕혀 하나의 술어로 본다.
 *
 * - `type` 이 null 이면 이체다. 종류·카테고리 조건은 이체에 거짓이 된다.
 * - `categoryIds` 에는 거래 카테고리와 **분할 항목 카테고리**가 함께 들어간다.
 *   그래서 포함은 "하나라도 맞으면", 제외는 "하나라도 걸리면" 이 자연히 된다.
 * - `assetIds` 는 거래면 한 개, 이체면 보내는 쪽·받는 쪽 두 개다.
 */
export interface FilterRow {
  /** "YYYY-MM-DD" */
  date: string;
  amount: number;
  type: ExpenseType | null;
  categoryIds: number[];
  assetIds: number[];
}

function overlaps(a: number[], b: number[]): boolean {
  return a.some((x) => b.includes(x));
}

function inAnyPeriod(date: string, periods: FilterPeriodRange[]): boolean {
  if (periods.length === 0) return true;
  return periods.some(
    (p) => (!p.start || date >= p.start) && (!p.end || date <= p.end),
  );
}

function inAnyAmountRange(amount: number, ranges: AmountRange[]): boolean {
  return ranges.some((r) => {
    const min = r.min === "" ? null : Number(r.min);
    const max = r.max === "" ? null : Number(r.max);
    if (min != null && amount < min) return false;
    if (max != null && amount > max) return false;
    return true;
  });
}

/** 종류 조건은 **하나만 고른 경우에만** 활성이다(둘 다 = 조건 없음). */
function typeActive(types: ExpenseType[]): boolean {
  return types.length === 1;
}

/** 지금 켜져 있는 포함 조건의 개수 — 배지와 "하나라도" 세그먼트 활성에 쓴다. */
export function activeConditionCount(f: FilterValue): number {
  let n = 0;
  if (typeActive(f.types)) n += 1;
  if (f.categories.include.length > 0) n += 1;
  if (f.assets.include.length > 0) n += 1;
  if (f.amountRanges.length > 0) n += 1;
  return n;
}

/**
 * 한 줄이 필터를 통과하는가.
 *
 * 순서가 규칙이다.
 *   ① 기간 — periods 중 하나에 들어야 한다. **항상 AND.**
 *   ② 제외 — 카테고리·계좌 exclude 에 하나라도 걸리면 뺀다. **항상 AND.**
 *   ③ 포함 — 켜져 있는 조건만 본다. match=all 이면 전부, any 면 하나라도.
 *      켜진 조건이 하나도 없으면 통과다.
 */
export function matchesFilter(row: FilterRow, f: FilterValue): boolean {
  if (!inAnyPeriod(row.date, f.periods)) return false;

  if (overlaps(row.categoryIds, f.categories.exclude)) return false;
  if (overlaps(row.assetIds, f.assets.exclude)) return false;

  const checks: boolean[] = [];
  if (typeActive(f.types)) {
    // 이체(type null)는 종류 개념이 없다 — 거짓.
    checks.push(row.type != null && f.types.includes(row.type));
  }
  if (f.categories.include.length > 0) {
    // 이체는 카테고리가 없으므로 categoryIds 가 비어 자연히 거짓이다.
    checks.push(overlaps(row.categoryIds, f.categories.include));
  }
  if (f.assets.include.length > 0) {
    checks.push(overlaps(row.assetIds, f.assets.include));
  }
  if (f.amountRanges.length > 0) {
    checks.push(inAnyAmountRange(row.amount, f.amountRanges));
  }

  if (checks.length === 0) return true;
  return f.match === "all" ? checks.every(Boolean) : checks.some(Boolean);
}

/** 조회에 쓸 바깥 범위 — periods 의 최소 시작 ~ 최대 종료. */
export function filterSpan(
  f: FilterValue,
): { start: string; end: string } | null {
  const withRange = f.periods.filter((p) => p.start && p.end);
  const first = withRange[0];
  if (!first) return null;
  return {
    start: withRange.reduce((a, p) => (p.start < a ? p.start : a), first.start),
    end: withRange.reduce((a, p) => (p.end > a ? p.end : a), first.end),
  };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
function fmtYmd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * 보고 있는 달의 기본 기간 — 필터를 처음 열거나 초기화할 때 쓴다.
 *
 * 이번 달이면 종전과 같은 "이번 달"(1일~오늘) 프리셋이다. 다른 달을 보고 있으면 그 달 1일~말일
 * 이다. 종전엔 늘 오늘 기준 이번 달이라, 8월을 보다가 필터를 열면 9월이 잡혀 있었다(QA 30 10).
 */
export function monthPeriodOf(monthKey: string): FilterPeriodRange {
  const today = new Date();
  const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  if (monthKey === thisMonth) return resolvePeriod("month");
  const [ys, ms] = monthKey.split("-");
  const y = Number(ys);
  const m = Number(ms);
  const last = new Date(y, m, 0).getDate();
  const mm = String(m).padStart(2, "0");
  return {
    preset: "custom",
    start: `${y}-${mm}-01`,
    end: `${y}-${mm}-${String(last).padStart(2, "0")}`,
  };
}

/** 두 기간이 같은 날들을 가리키는가 — 프리셋 이름은 안 본다. */
export function samePeriod(
  a: FilterPeriodRange,
  b: FilterPeriodRange,
): boolean {
  return a.start === b.start && a.end === b.end;
}

/**
 * 프리셋을 실제 범위로 바꾼다.
 *
 * v1 은 프리셋 이름만 들고 다니다 목록 화면에서 범위를 계산했다. v2 는 기간이 여러
 * 칸이라 **칸마다 범위를 확정해 둔다** — 조회 범위(최소~최대)를 한 번에 내려면
 * 프리셋이 아니라 날짜가 필요하다.
 */
export function resolvePeriod(preset: FilterPeriodPreset): FilterPeriodRange {
  const today = new Date();
  const end = fmtYmd(today);
  if (preset === "week") {
    const s = new Date(today);
    // 월요일 시작 — 일요일(0)은 지난 월요일로 6일 뒤로 간다.
    s.setDate(s.getDate() - ((s.getDay() + 6) % 7));
    return { preset, start: fmtYmd(s), end };
  }
  if (preset === "month") {
    const s = new Date(today.getFullYear(), today.getMonth(), 1);
    return { preset, start: fmtYmd(s), end };
  }
  if (preset === "3m") {
    const s = new Date(today);
    s.setMonth(s.getMonth() - 3);
    return { preset, start: fmtYmd(s), end };
  }
  const s = new Date(today);
  s.setMonth(s.getMonth() - 1);
  return { preset: "custom", start: fmtYmd(s), end };
}
