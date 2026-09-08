import type { MemoTag } from "@/entities/memo-tag";

/**
 * 태그가 하나도 없는 사용자에게만 보이는 선택지 — 서버 목록(`GET /memo-tags`)과 기존 메모에
 * 남은 이름이 **둘 다 비었을 때만** 쓴다.
 *
 * 하드코딩 7종을 통째로 지우지 않는 이유는 화면이 비기 때문이다. 태그를 아직 만들지 않은
 * 사용자에게 빈 select 를 내밀면 메모에 태그를 붙일 방법이 없어 설정 화면부터 다녀와야 한다.
 * 여기서 하나를 고르면 서버가 그 문자열로 마스터를 만들어 잇는다(`MemoServiceImpl.linkByName`
 * → `findOrCreateByName`) — 죽은 목록이 아니라 첫 태그를 만드는 통로다.
 *
 * '개인' 이 맨 앞인 건 종전 `DEFAULT_TAG` 가 그 값이었기 때문이다. 아직 태그가 없는
 * 사용자는 새 메모에서 지금까지와 같은 기본값을 본다(`memoTagOptions(...)[0]`).
 */
export const FALLBACK_TAG_NAMES = [
  "개인",
  "가계부",
  "자산",
  "업무",
  "건강",
  "결제",
  "고정비",
] as const;

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
 * 편집기 select 에 놓을 태그 이름 — **서버 마스터 ∪ 메모에 남은 이름**, 둘 다 비면 기본 7종.
 *
 * 남은 이름을 섞는 이유: 백필 전이거나 다른 클라이언트가 만든 메모의 태그가 아직 마스터에
 * 없을 수 있는데, 그 메모를 열었을 때 자기 태그가 목록에 없으면 select 가 빈칸으로 뜬다.
 * 순서는 서버가 준 순서(이름 오름차순)를 먼저 두고, 마스터에 없는 이름을 뒤에 붙인다.
 */
export function memoTagOptions(
  serverTags: readonly MemoTag[] | undefined,
  memos: readonly { tag: string | null }[],
): string[] {
  const names = (serverTags ?? []).map((tag) => tag.tagName);
  for (const memo of memos) {
    if (memo.tag && !names.includes(memo.tag)) names.push(memo.tag);
  }
  return names.length > 0 ? names : [...FALLBACK_TAG_NAMES];
}

/** 칩 필터·집계에서 이 메모가 속할 묶음 키. 태그가 없으면 '태그 없음' 묶음이다. */
export function memoTagKey(memo: { tag: string | null }): string {
  return memo.tag || NO_TAG_KEY;
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
