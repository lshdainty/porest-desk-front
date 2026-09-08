import type { MemoTag } from "@/entities/memo-tag";

/**
 * '태그 없음' 묶음을 가리키는 sentinel — 칩 필터 값과 편집기 select 값으로만 쓰고
 * 서버로는 나가지 않는다(`tagValueToPayload` 가 `null` 로 바꾼다).
 *
 * 종전엔 `memo.tag || "개인"` 으로 **태그 없는 메모를 '개인' 이라고 그렸다.** 이제 태그를
 * 지우면 서버가 그 메모의 태그를 실제로 비우므로(`MemoTagServiceImpl.deleteTag`), 그대로
 * 두면 삭제 확인창이 약속한 "태그 없음으로 남아요" 와 화면이 어긋난다 — '개인' 태그를
 * 지운 사용자가 여전히 '개인' 칩을 본다.
 *
 * 값은 U+FFFF(비문자)다. 태그 이름은 사용자가 치는 글자라 어떤 평범한 문자열도 sentinel 로
 * 쓸 수 없다 — 할일 화면이 `NO_DUE_KEY` 에 쓰는 것과 같은 수법이다.
 */
export const NO_TAG_KEY = "￿";

/**
 * 편집기 select 에 놓을 태그 이름 — **서버 마스터 ∪ 메모에 남은 이름**. 둘 다 비면 빈 목록이다.
 *
 * 남은 이름을 섞는 이유: 백필 전이거나 다른 클라이언트가 만든 메모의 태그가 아직 마스터에
 * 없을 수 있는데, 그 메모를 열었을 때 자기 태그가 목록에 없으면 select 가 빈칸으로 뜬다.
 * 순서는 서버가 준 순서(이름 오름차순)를 먼저 두고, 마스터에 없는 이름을 뒤에 붙인다.
 *
 * **비었을 때 이름을 지어내지 않는다**(QA #105). 한때 기본 7종('개인'·'가계부'…)을 채워
 * 넣었는데, 설정 목록엔 없는 이름이 편집기에만 떠서 제목만 쓰고 저장하면 **사용자가 만든 적
 * 없는 태그가 조용히 생겼다** — 서버가 그 문자열로 마스터를 만들어 잇기 때문이다(QA #79).
 * 목록이 비어도 select 는 안 빈다: '태그 없음' 항목이 화면에서 늘 따라붙고, 태그가 0개인
 * 사용자에겐 설정에서 만든다는 안내가 붙는다. 앱도 같은 자리를 같은 방식으로 그린다.
 */
export function memoTagOptions(
  serverTags: readonly MemoTag[] | undefined,
  memos: readonly { tag: string | null }[],
): string[] {
  const names = (serverTags ?? []).map((tag) => tag.tagName);
  for (const memo of memos) {
    if (memo.tag && !names.includes(memo.tag)) names.push(memo.tag);
  }
  return names;
}

/** 칩 필터·집계에서 이 메모가 속할 묶음 키. 태그가 없으면 '태그 없음' 묶음이다. */
export function memoTagKey(memo: { tag: string | null }): string {
  return memo.tag || NO_TAG_KEY;
}

/**
 * 편집기가 열릴 때 select 에 놓을 값 — 있는 메모는 지금 태그, **새 메모는 '태그 없음'**.
 *
 * 목록의 첫 태그를 채워 두면 제목만 쓰고 저장해도 그 태그가 붙는다 — 사용자가 시키지 않은
 * 쓰기다. 종전엔 하드코딩 '개인' 이라 **설정에 없던 태그가 저장 때 새로 생기기까지 했다**
 * (QA #105). 앱도 새 메모를 태그 없음으로 연다.
 */
export function memoTagInitialValue(
  memo: { tag: string | null } | null,
): string {
  return memo ? memoTagKey(memo) : NO_TAG_KEY;
}

/**
 * 편집기 select 값 → 서버로 보낼 `tag`.
 *
 * sentinel 은 화면 안에서만 쓰는 값이라 그대로 실으면 U+FFFF 라는 이름의 태그가 만들어진다.
 * '태그 없음' 은 `null` 이어야 서버가 문자열과 마스터 FK 를 함께 비운다(QA #88).
 */
export function tagValueToPayload(value: string): string | null {
  return value === NO_TAG_KEY ? null : value;
}
