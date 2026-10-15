import * as React from "react";

/**
 * 키보드 Esc 를 대화상자 · 시트보다 먼저 받는다 — Radix 는 문서에서 받으므로 창(window)에서 캡처로 먼저 막는다
 * (막힌 Esc 는 표면을 닫지 않는다). target 에 초점이 있을 때만 — 차트 상자의 툴팁만 닫고 바깥 표면은 남는다.
 */
export function useEscapeFirst(
  active: boolean,
  target: React.RefObject<HTMLElement | null>,
  onEscape: () => void,
) {
  const handler = React.useRef(onEscape);
  React.useLayoutEffect(() => {
    handler.current = onEscape;
  });
  React.useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.isComposing || e.target !== target.current)
        return;
      e.preventDefault();
      e.stopPropagation();
      handler.current();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [active, target]);
}
