import * as React from "react";

import type { PaginationSlots } from "./pagination-variants";

/*
 * 칸 수 — 화면 폭으로 고정이다: 480(이름 있는 중단점 sm) 이상 9칸 · 미만 7칸(화살표 둘 포함). rem 으로 적으면 브라우저 글자 크기
 * 설정에 따라 어긋나 px 로 적는다 — 숫자는 토큰 --breakpoint-sm 과 같다. 서버에서는 7칸(좁은 쪽이 안전하다).
 */
const WIDE_QUERY = "(min-width: 480px)";

function subscribe(onChange: () => void) {
  if (typeof window.matchMedia !== "function") return () => {};
  const mql = window.matchMedia(WIDE_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

const getSnapshot = (): PaginationSlots =>
  typeof window.matchMedia === "function" &&
  window.matchMedia(WIDE_QUERY).matches
    ? 9
    : 7;

export function usePaginationSlots(): PaginationSlots {
  return React.useSyncExternalStore(subscribe, getSnapshot, () => 7);
}
