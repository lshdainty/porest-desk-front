import type { TodoTag } from "@/entities/todo-tag";

/**
 * 할 일 태그 — 메모(`pages/memo/lib/memo-tags.ts`)와 **같은 규칙을 같은 모양으로** 둔다.
 *
 * 두 화면은 사용자에겐 같은 개념이다("태그를 지우면 태그 없음으로 남아요"). 한쪽만 고치면
 * 메모는 '태그 없음' 이라고 하고 할 일은 '개인' 이라고 하는 상태가 된다 — 실제로 그랬고
 * 그게 QA #103 이다. 이름이 두 벌인 건 담는 필드가 다르기 때문이다(메모 `tag` · 할 일
 * `category`). 로직은 한 줄도 다르지 않게 유지한다.
 */

/**
 * '태그 없음' 묶음을 가리키는 sentinel — 칩·분포 키와 편집기 select 값으로만 쓰고
 * 서버로는 나가지 않는다(`tagValueToPayload` 가 `null` 로 바꾼다).
 *
 * 종전엔 `todo.category || "개인"` 이라 **태그 없는 할 일을 '개인' 이라고 그렸다.** 태그를
 * 지우면 서버가 그 할 일의 `category` 와 매핑을 함께 비우는데(`TodoTagServiceImpl.deleteTag`),
 * 화면이 '개인' 을 계속 그리면 삭제 확인창이 약속한 "태그 없음으로 남아요" 와 어긋난다.
 *
 * 값은 U+FFFF(비문자)다. 태그 이름은 사용자가 치는 글자라 어떤 평범한 문자열도 sentinel 로
 * 쓸 수 없다 — 같은 화면의 `NO_DUE_KEY` 가 쓰는 수법이다.
 */
export const NO_TAG_KEY = "￿";

/**
 * 편집기 select 에 놓을 태그 이름 — **서버 마스터 ∪ 할 일에 남은 `category`**.
 * 둘 다 비면 빈 목록이다.
 *
 * 남은 이름을 섞는 이유: 백필 전이거나 다른 클라이언트가 만든 할 일의 `category` 가 아직
 * 마스터에 없을 수 있는데, 그 할 일을 열었을 때 자기 태그가 목록에 없으면 select 가 빈칸으로
 * 뜬다. 순서는 서버가 준 순서를 먼저 두고, 마스터에 없는 이름을 뒤에 붙인다.
 *
 * **비었을 때 이름을 지어내지 않는다**(QA #105 와 같은 판단). 종전 하드코딩 7종은 설정
 * 목록엔 없는 이름이라, 그걸 고른 채 저장하면 서버가 그 문자열로 마스터를 만들어
 * **사용자가 만든 적 없는 태그가 조용히 생겼다**(`TodoServiceImpl.resolveCategoryTag`).
 */
export function todoTagOptions(
  serverTags: readonly TodoTag[] | undefined,
  todos: readonly { category: string | null }[],
): string[] {
  const names = (serverTags ?? []).map((tag) => tag.tagName);
  for (const todo of todos) {
    if (todo.category && !names.includes(todo.category))
      names.push(todo.category);
  }
  return names;
}

/** 칩 필터·분포에서 이 할 일이 속할 묶음 키. 태그가 없으면 '태그 없음' 묶음이다. */
export function todoTagKey(todo: { category: string | null }): string {
  return todo.category || NO_TAG_KEY;
}

/**
 * 편집기가 열릴 때 select 에 놓을 값 — 있는 할 일은 지금 태그, **새 할 일은 '태그 없음'**.
 *
 * 목록의 첫 태그를 채워 두면 제목만 쓰고 저장해도 그 태그가 붙는다 — 사용자가 시키지 않은
 * 쓰기다. 종전엔 하드코딩 '개인' 이라 **설정에 없던 태그가 저장 때 새로 생기기까지 했다**
 * (QA #105). 앱도 새 항목을 태그 없음으로 연다.
 */
export function todoTagInitialValue(
  todo: { category: string | null } | null,
): string {
  return todo ? todoTagKey(todo) : NO_TAG_KEY;
}

/**
 * 편집기 select 값 → 서버로 보낼 `category`.
 *
 * sentinel 은 화면 안에서만 쓰는 값이라 그대로 실으면 U+FFFF 라는 이름의 태그가 만들어진다.
 * '태그 없음' 은 `null` 이어야 한다 — PUT 은 "키 없음=유지 · null=지움" 이라(`Patch`),
 * 키를 빼면 서버가 옛 `category` 를 그대로 지킨다.
 */
export function tagValueToPayload(value: string): string | null {
  return value === NO_TAG_KEY ? null : value;
}
