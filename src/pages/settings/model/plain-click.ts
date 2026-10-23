import type { MouseEvent } from "react";

/** 일반 왼쪽 클릭인가 — 새 탭 · 가운데 클릭 · 수정 키는 브라우저가 링크로 처리하게 둔다 */
export const isPlainClick = (e: MouseEvent) =>
  !e.defaultPrevented &&
  e.button === 0 &&
  !e.metaKey &&
  !e.ctrlKey &&
  !e.shiftKey &&
  !e.altKey;

export const settingsHref = (section: string) =>
  `/desk/settings?section=${section}`;
