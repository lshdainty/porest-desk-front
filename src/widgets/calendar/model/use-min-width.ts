import { useSyncExternalStore } from "react";

/**
 * 화면 폭이 `px` 이상인가 — 이름 있는 중단점(768 · 1280 · 1440)으로 못 가르는 자리용이다.
 * 레이아웃이 없는 환경(시험)에서는 `fallback`.
 */
export function useMinWidth(px: number, fallback = true): boolean {
  const query = `(min-width: ${px}px)`;
  return useSyncExternalStore(
    (notify) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => {};
      const mq = window.matchMedia(query);
      mq.addEventListener("change", notify);
      return () => mq.removeEventListener("change", notify);
    },
    () =>
      typeof window !== "undefined" && window.matchMedia
        ? window.matchMedia(query).matches
        : fallback,
    () => fallback,
  );
}
