import * as React from "react";

import { BUBBLE_POSITION } from "./help-bubble-variants";

/*
 * 화면 끝의 트리거 — 화살표를 트리거 가운데에 두려면 화살표 가운데가 말풍선 끝에서 20(모서리 14 + 화살표 폭의 반 6) 안쪽이어야 한다.
 * 트리거 가운데가 화면 끝에서 20 + 16 보다 가까우면 그쪽 가장자리 여백을 (가운데 − 20)으로 줄인다 — Radix 의 shift 가 말풍선을 그만큼
 * 더 붙여 화살표가 가운데에 남는다(2026-10-15 사용자 결정 Q-004-1 — 가장자리 16 은 지는 값, 하한 없이 0 까지).
 * 위 · 아래 말풍선은 왼쪽 · 오른쪽 여백만, 옆 말풍선은 위 · 아래 여백만 줄인다(뒤집어도 같은 축이다).
 * Help Bubble · Tooltip 이 함께 쓴다. 레시피(help-bubble.tsx)의 useBubbleEdgePadding 그대로다.
 */
const ARROW_REACH = BUBBLE_POSITION.arrowPadding + 12 / 2;
type BubbleSide = "top" | "right" | "bottom" | "left";
type EdgePadding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};
const FULL_EDGE: EdgePadding = { top: 16, right: 16, bottom: 16, left: 16 };

function edgePaddingFor(anchor: HTMLElement, side: BubbleSide): EdgePadding {
  const edge = BUBBLE_POSITION.collisionPadding;
  const fit = (room: number) =>
    Math.max(0, Math.min(edge, Math.floor(room - ARROW_REACH)));
  const r = anchor.getBoundingClientRect();
  const root = document.documentElement;
  if (side === "top" || side === "bottom") {
    const cx = r.left + r.width / 2;
    return {
      top: edge,
      bottom: edge,
      left: fit(cx),
      right: fit(root.clientWidth - cx),
    };
  }
  const cy = r.top + r.height / 2;
  return {
    left: edge,
    right: edge,
    top: fit(cy),
    bottom: fit(root.clientHeight - cy),
  };
}

const useIsoLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

// 열린 동안 트리거 자리를 재어 가장자리 여백을 고른다 — 창 크기 · 스크롤에 다시 잰다(같은 값이면 그대로 둬 Radix 가 다시 계산하지 않는다)
export function useBubbleEdgePadding(
  anchorRef: React.RefObject<HTMLElement | null>,
  open: boolean,
  side: BubbleSide,
) {
  const [padding, setPadding] = React.useState<EdgePadding>(FULL_EDGE);
  useIsoLayoutEffect(() => {
    if (!open) return;
    let frame = 0;
    const measure = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const next = edgePaddingFor(anchor, side);
      setPadding((prev) =>
        prev.top === next.top &&
        prev.right === next.right &&
        prev.bottom === next.bottom &&
        prev.left === next.left
          ? prev
          : next,
      );
    };
    const later = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("resize", later);
    window.addEventListener("scroll", later, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", later);
      window.removeEventListener("scroll", later, true);
    };
  }, [anchorRef, open, side]);
  return padding;
}
