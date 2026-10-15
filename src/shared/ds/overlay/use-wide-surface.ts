import { useSyncExternalStore } from "react";

/*
 * 폭이 1280(이름 있는 중단점 lg) 이상인가 — Responsive Dialog 가 대화상자 ↔ 시트를 가르고, Alert Dialog 의 바닥 버튼 크기
 * (40 ↔ 36)와 뒤로 가기 닫기(1280 미만만)가 쓴다. Input Button 의 시트 ↔ 팝오버와 같은 경계다(specs/components/dialog.md).
 * CSS 쪽은 `lg:` 를 쓰고, JS 가 가를 때만 이 훅을 쓴다. 숫자는 토큰 --breakpoint-lg(80rem)와 같다.
 */
export const WIDE_QUERY = "(min-width: 1280px)";

function subscribe(onChange: () => void) {
  if (typeof window.matchMedia !== "function") return () => {};
  const mql = window.matchMedia(WIDE_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

const getSnapshot = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia(WIDE_QUERY).matches;

// 서버 렌더링은 없다 — 있다면 좁은 쪽(시트)이 안전하다
const getServerSnapshot = () => false;

export function useWideSurface() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
