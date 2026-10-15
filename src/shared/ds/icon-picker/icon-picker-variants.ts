/*
 * Porest Icon Picker 의 모양 · 헬퍼 — 규칙은 icon-picker.tsx 머리 주석이다(컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
 * 수치 원본은 porest-design specs/components/icon-picker.yaml(값은 src/shared/ds/spec/icon-picker.json).
 */

// 칸 — 48 · 모서리 12 · 아이콘 24. 고른 칸은 안쪽 2px(::after) + 선 2.5. 호버 · 누름 바탕 + 2px 거리 축소, 키보드 포커스에만 바깥 링
export const CELL = [
  "relative flex size-12 shrink-0 cursor-pointer select-none items-center justify-center rounded-r3 bg-transparent text-fg-neutral scroll-m-1",
  "[&_svg]:pointer-events-none [&_svg]:size-6 [&_svg]:shrink-0 [&_svg]:[stroke-width:2] aria-selected:[&_svg]:[stroke-width:2.5]",
  "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:border-2 after:border-solid after:border-transparent after:content-['']",
  "aria-selected:after:border-stroke-neutral-contrast",
  "hover:bg-bg-layer-floating-pressed active:bg-bg-layer-floating-pressed",
  "[transition:background-color_var(--motion-duration-color-transition)_var(--motion-ease-easing),scale_var(--motion-duration-pressed-scale)_var(--motion-ease-pressed-scale)]",
  "[--press-basis:48] active:[scale:calc(1-2/var(--press-basis))] motion-reduce:active:[scale:1]",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus-ring",
].join(" ");

// 격자 — 칸 48 · 사이 최소 4(남는 폭은 칸 사이에 고르게) · 줄 사이 4. 시트 6열 · 팝오버 7열(icon-picker.yaml surface).
// 시트 본문이 308(48 × 6 + 4 × 5)보다 좁은 폰은 들어가는 만큼만 둔다 — 본문(@container)의 폭으로 가른다
export const GRID = "grid justify-between gap-x-x1 gap-y-x1";
export const GRID_COLUMNS = {
  sheet:
    "grid-cols-[repeat(auto-fill,48px)] @min-[308px]:grid-cols-[repeat(6,48px)]",
  popover: "grid-cols-[repeat(7,48px)]",
} as const;

// 묶음 머리 — List Header mediumWeak(14 · 500 · fg-neutral-subtle), 위 12 · 아래 8
export const GROUP_HEADER =
  "pb-x2 pt-x3 font-sans text-t4 font-medium text-fg-neutral-subtle";

// 결과 수를 알리기까지 — 치기를 멈춘 뒤 한 번(글자마다 읽지 않게)
export const ANNOUNCE_DELAY = 500;

// 팝오버 본문 — PopoverBody 와 같은 자리 · 같은 끝 흐림(위 20 · 아래 80 + 본문 안 여백 · 스크롤 여유 그만큼)
export const POPOVER_SCROLL =
  "min-h-0 flex-1 overflow-y-auto px-x6 pb-[80px] pt-[20px] scroll-pb-[80px] scroll-pt-[20px]";

export const cellsOf = (listbox: HTMLElement | null) =>
  listbox
    ? Array.from(listbox.querySelectorAll<HTMLElement>('[role="option"]'))
    : [];

// 스크롤하는 조상 — 시트 본문 · 팝오버 본문
function scrollParentOf(el: HTMLElement): HTMLElement | null {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const { overflowY } = getComputedStyle(p);
    if (overflowY === "auto" || overflowY === "scroll") return p;
  }
  return null;
}

// 고른 칸이 보이게 — 처음 열 때는 가운데로
export function centerInScroller(cell: HTMLElement) {
  const scroller = scrollParentOf(cell);
  if (!scroller) return;
  const box = scroller.getBoundingClientRect();
  const rect = cell.getBoundingClientRect();
  scroller.scrollTop += rect.top + rect.height / 2 - (box.top + box.height / 2);
}
