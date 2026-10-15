import * as React from "react";

import type { TopNavigationType } from "./top-navigation-variants";

/*
 * Top Navigation 의 문맥 · 훅 · 화면을 옮길 때의 도우미 — 컴포넌트 파일은 컴포넌트만 내보낸다(빠른 새로 고침).
 */

export const TypeContext = React.createContext<TopNavigationType>("standard");

export const ProductContext = React.createContext<string | null>(null);

/** 문서 제목을 "{title} - {product}" 로 쓴다(TopNavigationProvider 가 없으면 title 만) */
export function useScreenTitle(title: string) {
  const product = React.useContext(ProductContext);
  React.useEffect(() => {
    document.title = product ? `${title} - ${product}` : title;
  }, [title, product]);
}

const isScrollable = (el: Element) => {
  const overflowY = getComputedStyle(el).overflowY;
  return (
    (overflowY === "auto" ||
      overflowY === "scroll" ||
      overflowY === "overlay") &&
    el.scrollHeight > el.clientHeight
  );
};

/**
 * 화면을 옮긴 뒤 셸이 부른다 — 본문 스크롤(창 · main 과 제목을 감싼 스크롤 상자)을 맨 위로 보내고, 보이는 [data-screen-title] 에
 * 초점을 둔다(스크롤은 옮기지 않는다). 링은 키보드로 왔을 때만 보인다(:focus-visible).
 */
export function focusScreenTitle() {
  const title =
    Array.from(
      document.querySelectorAll<HTMLElement>("[data-screen-title]"),
    ).find((el) => el.getClientRects().length > 0) ?? null;
  const main = document.querySelector("main");
  const boxes = new Set<Element>();
  for (const start of [main, title]) {
    for (
      let node: Element | null = start;
      node && node !== document.body && node !== document.documentElement;
      node = node.parentElement
    ) {
      if (isScrollable(node)) boxes.add(node);
    }
  }
  for (const box of boxes) box.scrollTop = 0;
  window.scrollTo({ top: 0, left: window.scrollX });
  title?.focus({ preventScroll: true });
}

// ← 의 "앞 화면이 있는가" — react-router 는 history.state.idx 로 센다. 없으면 같은 사이트에서 들어왔는지 본다
export function hasPreviousEntry() {
  const state = window.history.state as { idx?: unknown } | null;
  if (state && typeof state.idx === "number") return state.idx > 0;
  try {
    return (
      document.referrer !== "" &&
      new URL(document.referrer).origin === window.location.origin &&
      window.history.length > 1
    );
  } catch {
    return false;
  }
}
