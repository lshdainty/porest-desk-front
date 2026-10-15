import * as React from "react";

/*
 * 본문의 스크롤 상태 — 위로 스크롤됨(data-scrolled, 머리 아래 선)과 넘침(Tab 이 서는지). 본문 · 그 아래 자식의 크기가 바뀌면
 * 다시 잰다. 끝 흐림은 재지 않는다 — scrollFog 면 늘 켜져 있다.
 * 다시 그리지 않고 DOM 에 바로 쓴다 — 열린 직후(Radix 가 처음 초점을 정하기 전)에 이미 넘친 본문이 Tab 순서에 있게.
 */
export function useBodyScroll(ref: React.RefObject<HTMLElement | null>) {
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const overflow = el.scrollHeight > el.clientHeight + 1;
      el.toggleAttribute("data-scrolled", el.scrollTop > 0);
      // 넘쳐 스크롤할 수 있으면 키보드로도 스크롤하도록 Tab 이 선다
      if (overflow) el.tabIndex = 0;
      else el.removeAttribute("tabindex");
    };
    const resize = new ResizeObserver(measure);
    const observeChildren = () => {
      resize.observe(el);
      for (const child of Array.from(el.children)) resize.observe(child);
    };
    const mutation = new MutationObserver(() => {
      observeChildren();
      measure();
    });
    observeChildren();
    mutation.observe(el, { childList: true });
    el.addEventListener("scroll", measure, { passive: true });
    measure();
    return () => {
      resize.disconnect();
      mutation.disconnect();
      el.removeEventListener("scroll", measure);
    };
  }, [ref]);
}
