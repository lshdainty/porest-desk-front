import * as React from "react";

/*
 * 표를 표로 그릴지 List 줄로 그릴지 — 768(이름 있는 중단점 md) 이상이면 표. 쓰는 쪽이 이 값으로 같은 데이터를 갈라 그린다
 * (table.md "768 미만은 List 줄로"). CSS 쪽은 `md:` 를 쓰고, JS 가 가를 때만 이 훅을 쓴다. 숫자는 토큰 --breakpoint-md(48rem)와 같다.
 */
const TABLE_QUERY = "(min-width: 768px)";

function subscribeLayout(onChange: () => void) {
  if (typeof window.matchMedia !== "function") return () => {};
  const mql = window.matchMedia(TABLE_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

const getSnapshot = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia(TABLE_QUERY).matches
    ? "table"
    : "list";

/** "table"(768 이상) · "list"(미만 — 쓰는 쪽이 같은 데이터를 List 줄로). 서버에서는 "list" */
export function useTableLayout(): "table" | "list" {
  return React.useSyncExternalStore(subscribeLayout, getSnapshot, () => "list");
}
