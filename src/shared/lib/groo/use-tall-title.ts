import { useCallback, useEffect, useRef } from "react";

/**
 * 제목이 두 줄을 넘는 줄에 `data-row-tall` 을 단다(I-29 P3 · list.md Align "제목이 두 줄을 넘으면 위").
 * 목록 단위 맞춤은 CSS(`[data-row-list]:has([data-row-tall])`)가 맡는다 — 이 훅은 줄 하나가 두 줄을 넘는지만 잰다.
 * 반환값은 `<List ref>` 에 건다. 줄 높이 ÷ 제목 줄 높이 > 2.5 면 세 줄 이상이다(배지·아이콘이 줄 높이를 조금 키워도 흔들리지 않게).
 */
export function useTallTitle() {
  const elRef = useRef<HTMLElement | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);

  const measure = useCallback(() => {
    const el = elRef.current;
    const title = el?.querySelector<HTMLElement>('[data-slot="list-title"]');
    if (!el || !title) return;
    const lh = parseFloat(getComputedStyle(title).lineHeight);
    const tall = Number.isFinite(lh) && lh > 0 && title.offsetHeight / lh > 2.5;
    el.toggleAttribute("data-row-tall", tall);
  }, []);

  useEffect(() => () => roRef.current?.disconnect(), []);

  return useCallback(
    (node: HTMLElement | null) => {
      roRef.current?.disconnect();
      elRef.current = node;
      if (!node) return;
      measure();
      if (typeof ResizeObserver === "undefined") return;
      const ro = new ResizeObserver(measure);
      const title = node.querySelector('[data-slot="list-title"]');
      ro.observe(node);
      if (title) ro.observe(title);
      roRef.current = ro;
    },
    [measure],
  );
}
