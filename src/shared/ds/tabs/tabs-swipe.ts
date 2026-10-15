/*
 * Porest Tabs 의 밀어 넘기기(TabsSwipeArea) — 순수 DOM 헬퍼 · 상수. 폰에서 화면 전체를 바꾸는 1차 탭만 쓴다(tabs.md Behavior).
 * 컴포넌트는 tabs.tsx 의 TabsSwipeArea 다.
 */

export const SWIPE_SLOP = 10; // 이만큼 움직이면 가로 · 세로를 가른다
export const SWIPE_DISTANCE = 0.25; // 손을 떼면 넘어가는 거리 — 칸 폭의 25%
export const FLICK_SPEED = 0.4; // 빠르게 튕기면(px/ms) 25% 가 안 돼도 넘어간다
export const FLICK_DISTANCE = 24; // 튕겨서 넘어가는 최소 거리
export const EDGE_FOLLOW = 1 / 3; // 이웃이 없는 쪽으로 밀면 손의 1/3 만 따라온다
export const COMMIT_WAIT = 300; // 값이 이만큼 안 바뀌면(제어 컴포넌트가 받지 않음) 제자리로

// 여기서 시작한 끌기는 넘기지 않는다 — 표시한 요소 · 입력칸 · 슬라이더(가로로 스크롤하는 칸은 따로 본다)
const NO_SWIPE =
  "[data-tabs-prevent-swipe], input, textarea, select, [contenteditable]:not([contenteditable=false]), [role=slider]";

export type Pane = { panel: HTMLElement; value: string };
export type Drag = {
  id: number;
  x0: number;
  y0: number;
  dragging: boolean;
  dx: number;
  x: number;
  w: number;
  current: HTMLElement | null;
  prev: Pane | null;
  next: Pane | null;
  samples: { t: number; x: number }[];
};
export type Commit = {
  value: string;
  from: HTMLElement;
  to: HTMLElement;
  fromX: number;
  toX: number;
  dir: 1 | -1;
  w: number;
  timer: number;
};

export function blocksSwipe(target: EventTarget | null, area: HTMLElement) {
  for (
    let el = target instanceof Element ? target : null;
    el && el !== area;
    el = el.parentElement
  ) {
    if (el.matches(NO_SWIPE)) return true;
    if (el.scrollWidth > el.clientWidth) {
      const overflow = getComputedStyle(el).overflowX;
      if (overflow === "auto" || overflow === "scroll") return true;
    }
  }
  return false;
}

// 고른 칸과 그 양옆 이웃 — 탭 목록의 순서로, 막힌 탭은 건너뛴다. 이웃 칸이 이 묶음 바로 아래에 있을 때만
export function panesOf(area: HTMLElement) {
  const root = area.getRootNode() as Document | ShadowRoot;
  const current = area.querySelector<HTMLElement>(
    ":scope > [role=tabpanel][data-state=active]",
  );
  const tab =
    current &&
    root.getElementById(current.getAttribute("aria-labelledby") ?? "");
  const list = tab?.closest("[role=tablist]");
  if (!current || !tab || !list) return null;
  const tabs = Array.from(
    list.querySelectorAll<HTMLButtonElement>(":scope > [role=tab]"),
  );
  const i = tabs.indexOf(tab as HTMLButtonElement);
  const near = (step: 1 | -1): Pane | null => {
    for (let j = i + step; j >= 0 && j < tabs.length; j += step) {
      const t = tabs[j]!;
      if (t.disabled) continue;
      const panel = root.getElementById(t.getAttribute("aria-controls") ?? "");
      return panel &&
        panel.parentElement === area &&
        t.dataset.value !== undefined
        ? { panel, value: t.dataset.value }
        : null;
    }
    return null;
  };
  return { current, prev: near(-1), next: near(1) };
}

export const moveTo = (el: HTMLElement, x: number) =>
  el.style.setProperty("transform", `translate3d(${x}px, 0, 0)`);

// 옆에서 들어오거나 나가는 칸 — 띄워서 보이고, 누르거나 읽히지 않는다
export function setPeek(el: HTMLElement, on: boolean) {
  if (on) {
    el.setAttribute("data-swipe-peek", "");
    el.setAttribute("aria-hidden", "true");
    el.inert = true;
  } else {
    el.removeAttribute("data-swipe-peek");
    el.removeAttribute("aria-hidden");
    el.inert = false;
  }
}

export function resetPanel(el: HTMLElement | null | undefined) {
  if (!el) return;
  el.style.removeProperty("transform");
  el.style.removeProperty("transition");
  setPeek(el, false);
}

export function clearSwipe(
  area: HTMLElement,
  els: (HTMLElement | null | undefined)[],
) {
  for (const el of els) resetPanel(el);
  area.removeAttribute("data-swiping");
}

// 지금 자리에서 목표 자리로 200ms(motion-duration-d4 · motion-ease-easing)에 미끄러뜨리고 끝나면 done
export function slide(
  area: HTMLElement,
  moves: [HTMLElement, number][],
  done: () => void,
) {
  const ms =
    parseFloat(
      getComputedStyle(area).getPropertyValue("--motion-duration-d4"),
    ) || 200;
  void area.offsetWidth; // 지금 자리를 확정한 다음 전환을 건다
  for (const [el, x] of moves) {
    el.style.setProperty(
      "transition",
      "transform var(--motion-duration-d4) var(--motion-ease-easing)",
    );
    moveTo(el, x);
  }
  return window.setTimeout(done, ms + 32);
}

// 손을 뗄 때의 속도(px/ms, 오른쪽 +) — 마지막 100ms 의 움직임
export function speedOf(samples: { t: number; x: number }[]) {
  const last = samples[samples.length - 1];
  const first = samples.find((s) => last && last.t - s.t <= 100);
  if (!last || !first || last.t === first.t) return 0;
  return (last.x - first.x) / (last.t - first.t);
}
