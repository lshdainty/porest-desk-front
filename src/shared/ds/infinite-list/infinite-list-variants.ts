/*
 * Groo Infinite List 의 모양 규칙 · 상수. 컴포넌트는 infinite-list.tsx 다(컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로고침).
 * 수치 원본은 groo-design specs/components/infinite-list.yaml(값은 src/shared/ds/spec/infinite-list.json) — 쓰는 규칙은
 * specs/components/pagination.md 의 "폰은 끝없이 불러오기"다.
 */

/** 받는 시점 — 목록 끝이 화면(스크롤 상자) 아래 끝에서 300 안으로 오면 다음 쪽을 부른다(infinite-list.yaml sentinel.threshold) */
export const REACH_THRESHOLD = 300;

export type InfiniteListStatus = "loading" | "error" | "end";

// 목록 끝 자리 — 목록 마지막 줄 아래 24 · 가운데(그 아래는 화면 바닥 여백 — 탭 바가 있으면 그 여백)
export const INFINITE_LIST_ROOT =
  "flex flex-col items-center justify-center py-x6 font-sans";

// 글 — 못 불러옴 · 끝. t4 · 400. 못 불러옴은 문장이라 muted, 끝은 덧붙인 정보라 subtle(글자 역할 D5)
export const INFINITE_LIST_MESSAGE =
  "flex flex-col items-center text-center break-keep [overflow-wrap:break-word]";
export const INFINITE_LIST_TEXT = {
  error: "m-0 text-t4 font-normal text-fg-neutral-muted",
  end: "m-0 text-t4 font-normal text-fg-neutral-subtle",
} as const;

// 다시 시도 — 글 아래 12(Button neutralWeak small)
export const INFINITE_LIST_RETRY = "mt-x3";

/** 가장 가까운 세로 스크롤 상자 — 없으면 화면(null) */
export function scrollParent(el: HTMLElement): HTMLElement | null {
  for (
    let node = el.parentElement;
    node &&
    node !== node.ownerDocument.body &&
    node !== node.ownerDocument.documentElement;
    node = node.parentElement
  ) {
    const overflowY = getComputedStyle(node).overflowY;
    if (
      overflowY === "auto" ||
      overflowY === "scroll" ||
      overflowY === "overlay"
    )
      return node;
  }
  return null;
}
