import type { Todo, TodoPriority } from "@/entities/todo";
import { toLocalDateKey } from "@/shared/lib/date";

/** 우선순위 별빛 가중치 — 서버 적립 규칙 미러(중요 3 · 보통 2 · 여유 1). */
export const WEIGHT: Record<TodoPriority, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};
/** 쌓는 차례 — 막대는 이 차례로 아래부터 쌓는다(중요 → 보통 → 여유 → 메모). */
export const PRIO_ORDER: TodoPriority[] = ["HIGH", "MEDIUM", "LOW"];

/**
 * 별빛 분석 색 — chart.md 배정 순서(중요 파랑 · 보통 초록 · 여유 주황 · 메모 별빛 보라). 계열 색이라 배지 톤(중요만 critical)과 다른 일이다.
 * 다크는 토큰이 바꾼다.
 */
export const PRIO_COLOR: Record<TodoPriority | "MEMO", string> = {
  HIGH: "var(--color-chart-blue)",
  MEDIUM: "var(--color-chart-green)",
  LOW: "var(--color-chart-orange)",
  MEMO: "var(--color-chart-violet)",
};

/** 관측 리포트가 거슬러 가는 주 수 — 지난주까지(Q3-B · 나의 밤하늘과 같은 서버 기본 14일). */
export const REPORT_MAX_WEEKS_BACK = 1;
/** 리포트가 받는 하늘 기록 일수(서버 기본). */
export const REPORT_SKY_DAYS = 14;

export function isoOf(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return isoOf(d);
}
/** 해당 날짜가 속한 주의 월요일. */
export function mondayOf(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  const shift = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - shift);
  return isoOf(d);
}
/**
 * 완료일 키 — 주간 스트립·일별 칸이 쓰는 로컬 'YYYY-MM-DD'.
 *
 * completedAt 은 서버가 주는 `[UTC]` 라 문자열을 자르면 UTC 날짜가 나온다. 이 키는
 * [isoOf] 가 로컬 달력으로 만든 요일 컬럼과 맞대 보므로, KST 새벽에 끝낸 할일이
 * 전날 칸으로 들어간다. 그래서 파싱해서 로컬 날짜로 만든다.
 */
export function doneKey(t: Todo): string | null {
  return t.status === "COMPLETED" ? toLocalDateKey(t.completedAt) : null;
}
