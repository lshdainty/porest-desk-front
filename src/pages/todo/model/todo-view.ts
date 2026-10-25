import { formatMonthDay, formatMonthDayDow } from "@/shared/lib/date";
import { i18n } from "@/shared/i18n/config";
import { NO_TAG_KEY, todoTagKey } from "@/pages/todo/lib/todo-tags";
import type { Todo } from "@/entities/todo";

/** 'YYYY-MM-DD' → { md: 'M월 D일', full: 'M월 D일 (요일)' }. */
export function kDate(s: string): { md: string; full: string } {
  return { md: formatMonthDay(s), full: formatMonthDayDow(s) };
}

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
