import type * as React from "react";

/*
 * 줄을 누르는 순간 기준 길이 max(높이, 폭 ÷ 4, 24) 를 --press-basis 로 둔다(Button · List 와 같은 식) — 콘텐츠 층이
 * calc(1 - 2 / 기준) 만큼 줄어 "2px 거리 축소" 가 된다. Menu · Menu Sheet 가 함께 쓴다.
 */
export function measurePress(el: HTMLElement) {
  el.style.setProperty(
    "--press-basis",
    String(Math.max(el.offsetHeight, el.offsetWidth / 4, 24)),
  );
}

export const isPressKey = (e: React.KeyboardEvent) =>
  e.key === " " || e.key === "Enter";
