import { cva } from "class-variance-authority";

/*
 * Groo Tabs 의 클래스 · 상수 · 순수 헬퍼 — Line(목록 · 탭 · 막대 · 알림 점) · Chip Tabs(목록 · 알림 점) · 내용 칸. 수치 원본은
 * groo-design specs/components/tabs.yaml · chip-tabs.yaml(값은 src/shared/ds/spec/tabs.json · chip-tabs.json). 무엇이 언제
 * 바뀌는지는 tabs.tsx 머리 주석이다(컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
 */

export type LineLayout = "fill" | "hug";
export type LineSize = "small" | "medium";
export type ChipTabsVariant = "solid" | "outline";
export type ChipTabsSize = "medium" | "large";

// Chip Tabs 의 변형 → Chip 의 변형(chip-tabs.yaml)
export const CHIP_VARIANT = {
  solid: "solid",
  outline: "outlineStrong",
} as const;

// 목록 — 놓인 폭을 채우고 바탕은 불투명하다. 바닥 구획 선은 안쪽 1px(inset)이라 목록 높이를 밀지 않는다.
// --tabs-indicator-inset 은 막대를 탭에서 들이는 거리다
export const tabsListVariants = cva(
  "relative flex w-full bg-bg-layer-default font-sans shadow-[inset_0_-1px_0_0_var(--color-stroke-neutral-subtle)]",
  {
    variants: {
      layout: {
        // 칸을 똑같이 나눈다 — 막대는 탭에서 좌우 16 들인다. 글이 칸을 넘으면 Fill 모양 그대로(Hug 로 바꾸지 않는다) 목록만
        // 가로 스크롤(스크롤바는 숨긴다)하고, 고른 탭은 가장자리와 scroll-padding 16 을 두고 드러낸다(SEED, 03-G 결정 3B)
        fill: "overflow-x-auto px-0 scroll-px-x4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [--tabs-indicator-inset:var(--spacing-x4)]",
        // 글만큼 — 목록 좌우 16, 넘치면 가로 스크롤(스크롤바는 숨긴다). 고른 탭은 가장자리와 16 을 두고 드러낸다. 막대는 탭 폭 그대로
        hug: "overflow-x-auto px-x4 scroll-px-x4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [--tabs-indicator-inset:0px]",
      },
      size: {
        small: "min-h-[40px]",
        medium: "min-h-[44px]",
      },
    },
    defaultVariants: { layout: "fill", size: "small" },
  },
);

// 탭 — 위아래 · 좌우 10, 글을 아래로 붙인다. 고르면 글자색만 바로 바뀐다(전환 없음 — 막히면 비활성 색이 이긴다).
// 호버 모양은 없고 누르면 탭만 2px 거리로 준다. 포커스 링은 탭 안쪽 2px(각진 모서리). relative — 막대보다 위에 그린다
export const tabsTriggerVariants = cva(
  [
    "relative inline-flex cursor-pointer select-none items-end justify-center whitespace-nowrap p-x2_5 font-sans font-bold text-fg-neutral-subtle",
    "enabled:data-[state=active]:text-fg-neutral",
    "[transition:scale_var(--motion-duration-pressed-scale)_var(--motion-ease-pressed-scale)]",
    "active:[scale:calc(1-2/var(--press-basis))] motion-reduce:active:[scale:1]",
    "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-stroke-focus-ring",
    "disabled:cursor-not-allowed disabled:text-fg-disabled disabled:[scale:1]",
  ].join(" "),
  {
    variants: {
      layout: {
        fill: "flex-1",
        hug: "flex-none",
      },
      size: {
        small: "min-h-[40px] text-t4 [--press-basis:40]",
        medium: "min-h-[44px] text-t5 [--press-basis:44]",
      },
    },
    defaultVariants: { layout: "fill", size: "small" },
  },
);

// 막대 — 고른 탭 아래 2px, 끝이 각지다. 자리(--tabs-indicator-left · -width)는 고른 탭을 재서 넣고 들임은 목록이 정한다.
// 목록의 첫 자식이라 탭(relative)이 그 위에 그려진다 — 키보드 포커스 링이 막대에 가리지 않는다. 고른 탭이 막히면 fg-disabled
export const TABS_INDICATOR = [
  "pointer-events-none absolute bottom-0 h-0.5 rounded-none bg-fg-neutral",
  "[[role=tablist]:has(>[role=tab][data-state=active]:disabled)>&]:bg-fg-disabled",
  "left-[calc(var(--tabs-indicator-left,0px)_+_var(--tabs-indicator-inset))] w-[max(0px,calc(var(--tabs-indicator-width,0px)_-_2_*_var(--tabs-indicator-inset)))]",
  "[transition:left_var(--motion-duration-d4)_var(--motion-ease-easing),width_var(--motion-duration-d4)_var(--motion-ease-easing)]",
].join(" ");

// 알림 점 — 브랜드 글자색, 글 끝에서 2 · 글 위쪽. 띄워 두므로 탭 폭이 넓어지지 않는다. 고른 탭에는 그리지 않는다
export const TABS_NOTIFICATION =
  "pointer-events-none absolute left-[calc(100%_+_2px)] top-0 size-[6px] rounded-full bg-fg-brand";

// Chip Tabs 목록 — 바탕 · 바닥 선 없이 한 줄 가로 스크롤(스크롤바는 숨긴다). 좌우 화면 여백 24 · 위아래 8 · 칩 사이 8.
// 고른 칩을 드러낼 때는 가장자리와 화면 여백 24 를 둔다(scroll-padding). 양 끝 흐림(Scroll Fog row 좌우 20)은 useScrollFog 가 건다
export const chipTabsListVariants = cva(
  "relative flex w-full flex-nowrap gap-between-chips overflow-x-auto px-global-gutter py-x2 scroll-px-global-gutter font-sans [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
);

// Chip Tabs 알림 점 — 브랜드 글자색, 글 뒤 6(칩의 사이)에 세로 가운데. 칩 폭이 그만큼 넓어진다. 고른 칩(짙은 채움)에는 그리지 않는다
export const CHIP_TABS_NOTIFICATION =
  "pointer-events-none size-[6px] shrink-0 rounded-full bg-fg-brand";

// 내용 칸 — 모두 그려 두고 고르지 않은 칸은 숨긴다. 밀어 넘기는 동안 옆에서 들어오고 나가는 칸은 TabsSwipeArea 가 data-swipe-peek 를
// 달아 띄운다. 키보드 포커스 링은 탭과 같이 안쪽 2px 다(칸이 화면 폭을 채워 바깥 링은 잘린다)
export const TABS_CONTENT = [
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-stroke-focus-ring",
  "data-[state=inactive]:hidden",
  "data-[swipe-peek]:absolute data-[swipe-peek]:inset-x-0 data-[swipe-peek]:top-0 data-[state=inactive]:data-[swipe-peek]:block",
].join(" ");

// 밀어 넘기기 묶음 — 이웃 칸이 들어올 자리(relative), 미는 동안만 넘친 것을 자른다. 손가락일 때만 가로 끌기를 받는다
export const TABS_SWIPE_AREA =
  "relative pointer-coarse:[touch-action:pan-y_pinch-zoom] data-[swiping]:overflow-clip";

export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const selectedTabIn = (list: HTMLElement) =>
  list.querySelector<HTMLElement>(":scope > [role=tab][data-state=active]");

// 고른 탭이 목록 밖이면 가까운 쪽으로 목록만 스크롤한다 — 가장자리와 scroll-padding(Hug 16 · Chip Tabs 24)만큼 띄운다
export function revealSelected(list: HTMLElement, smooth: boolean) {
  if (list.scrollWidth <= list.clientWidth) return;
  const tab = selectedTabIn(list);
  if (!tab) return;
  const pad = parseFloat(getComputedStyle(list).scrollPaddingLeft) || 0;
  const start = tab.offsetLeft - pad;
  const end = tab.offsetLeft + tab.offsetWidth + pad - list.clientWidth;
  const to =
    list.scrollLeft > start ? start : list.scrollLeft < end ? end : null;
  if (to === null) return;
  list.scrollTo({
    left: to,
    behavior: smooth && !prefersReducedMotion() ? "smooth" : "auto",
  });
}

// 막대가 놓인 자리 — 같은 자리면 다시 놓지 않는다
export type PlacedBar = { left: number; width: number } | null;

// 막대를 고른 탭 아래에 놓는다. animate 면 미끄러지고, 아니거나 처음이면 전환 없이 바로 놓는다. 놓은 자리를 돌려준다
export function placeIndicator(
  list: HTMLElement,
  bar: HTMLElement,
  was: PlacedBar,
  animate: boolean,
): PlacedBar {
  const tab = selectedTabIn(list);
  if (!tab) {
    bar.hidden = true;
    return null;
  }
  const left = tab.offsetLeft;
  const width = tab.offsetWidth;
  if (was && !bar.hidden && was.left === left && was.width === width) {
    return was;
  }
  const instant = !animate || !was || bar.hidden;
  bar.hidden = false;
  if (instant) bar.style.setProperty("transition", "none");
  bar.style.setProperty("--tabs-indicator-left", `${left}px`);
  bar.style.setProperty("--tabs-indicator-width", `${width}px`);
  if (instant) {
    void getComputedStyle(bar).left; // 전환 없이 지금 자리를 확정한 다음 전환을 되돌린다
    bar.style.removeProperty("transition");
  }
  return { left, width };
}
