import type { Todo } from "@/entities/todo";

/** 할 일 목록 필터 탭. */
export type FilterKey = "today" | "week" | "all" | "done";

/** dueDate(날짜 또는 datetime) → 'YYYY-MM-DD'. nullable. */
export function dueKey(due: string | null | undefined): string | null {
  if (!due) return null;
  return due.slice(0, 10);
}

/** 두 'YYYY-MM-DD' 사이 일수 차이 (b - a). */
export function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

/** 오늘부터 7일 안에 마감인가. `today` 를 받아 모듈 스코프에 둔다 — 컴포넌트 안에
 *  두면 매 렌더 새 함수라 이걸 쓰는 useMemo 가 의존성을 정직하게 못 적는다. */
export function inSevenDays(today: string, key: string | null): boolean {
  if (!key) return false;
  const diff = dayDiff(today, key);
  return diff >= 0 && diff <= 7;
}

export function isDone(t: Todo): boolean {
  return t.status === "COMPLETED";
}

/**
 * 필터 탭에 보일 할 일 — **방금 토글한 행(`held`)은 뒤집힌 상태여도 남긴다.**
 *
 * 완료를 따닥 누르면 다른 할 일까지 완료됐다(QA #29). 원인은 정렬이 아니라 이 필터
 * 한 줄이다 — 낙관 갱신이 status 를 즉시 COMPLETED 로 뒤집으면 그 행이 바로 빠지고
 * 아래 행이 같은 좌표로 올라와, 두 번째 탭이 다음 항목을 완료시켰다.
 * 잠깐 자리를 지키면 두 번째 탭은 **같은 행의 이미 잠긴 버튼**에 떨어진다.
 *
 * 탭 뱃지 카운트에는 이 예외를 걸지 않는다 — 숫자는 사실대로 줄어야 한다.
 */
export function visibleTodos(
  todos: Todo[],
  filter: FilterKey,
  today: string,
  held: ReadonlySet<number> = new Set(),
): Todo[] {
  const open = (t: Todo) => !isDone(t) || held.has(t.rowId);
  if (filter === "today")
    return todos.filter((t) => open(t) && dueKey(t.dueDate) === today);
  if (filter === "week")
    return todos.filter(
      (t) => open(t) && inSevenDays(today, dueKey(t.dueDate)),
    );
  if (filter === "all") return todos.filter(open);
  // 완료 탭 — 방금 해제한 행도 붙든다(반대 방향의 같은 재배치).
  return todos.filter((t) => isDone(t) || held.has(t.rowId));
}
