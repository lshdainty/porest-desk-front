/*
 * Groo Searchable List 의 줄 · 검색칸 자리 상수 — 수치 원본은 groo-design specs/components/searchable-list.yaml
 * (값은 src/shared/ds/spec/searchable-list.json). 줄 · 검색칸의 나머지 값은 list.yaml · input.yaml 이다.
 * 컴포넌트와 규칙은 searchable-list.tsx 머리 주석이다.
 */

// 줄 — 바탕 층(::before — 강조 · 누름, 줄지 않는다)과 콘텐츠 층(누르면 2px 거리 축소). 바탕은 줄 폭 전체(0 · 모서리 0)에서
// 짚으면 좌우 6 · 모서리 10 으로 들어오며 150ms 에 색과 함께 바뀐다(Menu · List, Q-009-3). 화살표로 옮기는 동안은 전환 없이 바로
export const OPTION = [
  "group/sl-option relative flex w-full cursor-pointer select-none outline-none",
  "before:pointer-events-none before:absolute before:inset-y-0 before:inset-x-0 before:rounded-none before:bg-transparent before:content-['']",
  "data-[highlighted]:before:inset-x-x1_5 data-[highlighted]:before:rounded-r2_5 data-[highlighted]:before:bg-bg-layer-default-pressed",
  "active:before:inset-x-x1_5 active:before:rounded-r2_5 active:before:bg-bg-layer-default-pressed",
  "before:[transition:background-color_var(--motion-duration-color-transition)_var(--motion-ease-easing),inset_var(--motion-duration-color-transition)_var(--motion-ease-easing),border-radius_var(--motion-duration-color-transition)_var(--motion-ease-easing)]",
  "[[data-highlight-source=keyboard]_&]:before:transition-none",
].join(" ");

export const OPTION_CONTENT = [
  "relative flex w-full items-center px-global-gutter py-x3",
  "[transition:scale_var(--motion-duration-pressed-scale)_var(--motion-ease-pressed-scale)]",
  "group-active/sl-option:[scale:calc(1-2/var(--press-basis))] motion-reduce:group-active/sl-option:[scale:1]",
].join(" ");

// 검색칸 자리 — 위에 붙는다(목록만 스크롤). 좌우 24 안에 두어 돋보기와 줄의 앞 붙이개가 한 줄에 선다. 바탕은 놓인 자리의 면
export const FIELD_STICKY = "sticky top-0 z-1 px-global-gutter";
export const FIELD_SURFACE = {
  sheet: "bg-bg-layer-floating",
  inline: "bg-bg-layer-default",
} as const;

// 누르는 순간 기준 길이 max(높이, 폭 ÷ 4, 24) 를 --press-basis 로 — 줄은 폭 ÷ 4 가 커서 세로로는 2px 보다 덜 준다(List 와 같다)
export function measurePress(el: HTMLElement) {
  el.style.setProperty(
    "--press-basis",
    String(Math.max(el.offsetHeight, el.offsetWidth / 4, 24)),
  );
}
