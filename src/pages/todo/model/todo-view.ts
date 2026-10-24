import { formatMonthDay, formatMonthDayDow } from "@/shared/lib/date";
import { i18n } from "@/shared/i18n/config";
import { dayDiff } from "@/pages/todo/lib/visible-todos";
import { NO_TAG_KEY, todoTagKey } from "@/pages/todo/lib/todo-tags";
import type { Todo, TodoPriority } from "@/entities/todo";

// 우선순위 칩/아이콘 스타일 (양 플랫폼 공통 확정).
//  high = chart-red + bg 14% 틴트 / med = chart-orange + 14% 틴트 /
//  low  = fg-tertiary + bg-sunken.
export const PRIO: Record<
  TodoPriority,
  { labelKey: string; color: string; bg: string; order: number }
> = {
  // 중요=error(빨강)/보통=warning(노랑)/여유=info(파랑) — status-*-fg 는
  // 다크에서 *-light 로 스왑되는 토큰 (사용자 결정, 앱 todo_meta 동기).
  HIGH: {
    labelKey: "prio.HIGH",
    color: "var(--status-danger-fg)",
    bg: "var(--color-bg-critical-weak)",
    order: 0,
  },
  MEDIUM: {
    labelKey: "prio.MEDIUM",
    color: "var(--status-warning-fg)",
    bg: "var(--color-bg-warning-weak)",
    order: 1,
  },
  LOW: {
    labelKey: "prio.LOW",
    color: "var(--status-info-fg)",
    bg: "var(--color-bg-informative-weak)",
    order: 2,
  },
};
export const PRIO_ORDER: TodoPriority[] = ["HIGH", "MEDIUM", "LOW"];

/** 'YYYY-MM-DD' → { full: 'M월 D일 (요일)' }. */
export function kDate(s: string): { md: string; full: string } {
  return { md: formatMonthDay(s), full: formatMonthDayDow(s) };
}

/** 상대 시간: 오늘/내일/어제/N일 후/N일 전(±7) · 그 외 'M월 D일'. */
export function relativeDate(due: string, today: string): string {
  const diff = dayDiff(today, due);
  if (diff === 0) return i18n.t("date:today");
  if (diff === 1) return i18n.t("date:tomorrow");
  if (diff === -1) return i18n.t("date:yesterday");
  if (diff > 0 && diff <= 7) return i18n.t("date:daysLater", { count: diff });
  if (diff < 0 && diff >= -7) return i18n.t("date:daysAgo", { count: -diff });
  return kDate(due).md;
}

// 그룹 정렬 시 맨 뒤로 보내기 위한 sentinel. `todo-tags` 의 `NO_TAG_KEY` 와 값이 같은데,
// 쓰는 키 공간이 다르다(날짜 그룹 · 태그 묶음) — 한쪽에서 다른 쪽을 비교하지 않는다.
export const NO_DUE_KEY = "￿";

/**
 * 묶음 키 → 화면 라벨. sentinel 은 번역 문구로 바꿔 그린다 — U+FFFF 를 그대로 그리면
 * 안 보이는 글자 하나가 태그 이름 자리에 남는다.
 */
export function tagKeyLabel(key: string): string {
  return key === NO_TAG_KEY ? i18n.t("todo:noTag") : key;
}

/**
 * Todo.category → 태그 라벨. 태그가 없으면 '태그 없음' 이다.
 *
 * 종전엔 `t.category || '개인'` 이라 **태그를 지운 할 일이 '개인' 으로 보였다**(QA #103).
 * 서버는 태그를 지울 때 그 할 일의 `category` 를 실제로 비우므로, 화면이 이름을 지어내면
 * 삭제 확인창이 약속한 "태그 없음으로 남아요" 와 어긋난다. 메모 화면과 같은 규칙이다.
 */
export function todoTagLabel(td: Todo): string {
  return tagKeyLabel(todoTagKey(td));
}

export const dot = {
  width: 2,
  height: 2,
  borderRadius: 999,
  background: "var(--border-strong)",
  flexShrink: 0,
} as const;
