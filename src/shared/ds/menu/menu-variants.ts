/*
 * Porest Menu 의 모양 — 수치 원본은 porest-design specs/components/menu.yaml(값은 src/shared/ds/spec/menu.json).
 * porest-design recipes/shadcn/components/ui/menu.tsx 를 첫 판으로 가져왔다 — 이 파일은 모양 정의,
 * 컴포넌트는 menu.tsx 다(컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
 */

// 메뉴 — 폭 200 · 모서리 20 · 떠 있는 바탕 + s3 · z-floating 200. 열 때 150ms enter · 닫을 때 100ms exit 로 0.95 ↔ 1 · 투명도,
// 트리거 쪽 변에서 커진다. 모션 줄이기면 투명도만(크기는 motion-safe 에서만). 길이는 --tw-animation-duration 으로 준다 —
// duration-* 는 transition-duration 도 바꿔(transition-property 의 처음 값은 all) 테마를 바꿀 때 색까지 번지게 한다
export const MENU_CONTENT = [
  "z-(--z-floating) w-[200px] overflow-hidden rounded-r5 bg-bg-layer-floating font-sans text-fg-neutral shadow-[var(--shadow-s3)] outline-none",
  "origin-[var(--radix-dropdown-menu-content-transform-origin)]",
  "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:[--tw-animation-duration:var(--motion-duration-d3)] data-[state=open]:ease-[var(--motion-ease-enter)] motion-safe:data-[state=open]:zoom-in-95",
  "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:[--tw-animation-duration:var(--motion-duration-d2)] data-[state=closed]:ease-[var(--motion-ease-exit)] motion-safe:data-[state=closed]:zoom-out-95",
].join(" ");

// 스크롤 자리 — 위아래 8 · 묶음 사이 8. 높이는 min(480, max(200, 남은 화면)) — 자리를 재기 전에는 200
// (아래가 200 이상 남으면 줄여서 아래에 두고 200 아래일 때만 위로 뒤집는다 — Radix 는 뒤집기를 먼저 재므로 처음 잴 때 높이를 200 으로 준다)
export const MENU_SCROLL =
  "relative flex max-h-[min(480px,max(200px,var(--radix-dropdown-menu-content-available-height,200px)))] flex-col gap-x2 overflow-y-auto py-x2";

// 묶음 — 둘째 묶음부터 위에 1px 선(좌우 16 들임 · 아래 8). 위쪽 8 은 스크롤 자리의 gap — 묶음 사이 8 + 1 + 8 = 17
export const MENU_GROUP =
  "flex flex-col [[data-slot=menu-group]+&]:before:mx-x4 [[data-slot=menu-group]+&]:before:mb-x2 [[data-slot=menu-group]+&]:before:h-px [[data-slot=menu-group]+&]:before:shrink-0 [[data-slot=menu-group]+&]:before:bg-stroke-neutral-subtle [[data-slot=menu-group]+&]:before:content-['']";

// 묶음 이름 — t3 · fg-neutral-subtle · 위아래 8 · 좌우 16. 누를 수 없다
export const MENU_GROUP_LABEL =
  "select-none px-x4 py-x2 text-t3 font-normal text-fg-neutral-subtle break-keep [overflow-wrap:break-word]";

// 줄 — 위아래 10 · 좌우 16. 알약(MENU_PILL)이 호버 바탕과 키보드 링을 맡는다
export const MENU_ITEM =
  "group/menu-item relative flex cursor-pointer select-none items-center px-x4 py-x2_5 outline-none scroll-my-x2 data-[disabled]:cursor-not-allowed";

// 알약 — 좌우 8 들어온 모서리 12 상자. 마우스를 올리거나(마우스가 있는 기기에서만) 누르면 칠해진다. 막힌 줄에는 없다.
// 키보드로 옮긴 줄은 같은 자리에 안쪽 2px 링(바탕 없음) — 링을 알약에 그려 자리 · 모서리가 칠하는 바탕과 같다
export const MENU_PILL = [
  "pointer-events-none absolute inset-y-0 inset-x-x2 rounded-r3 bg-transparent",
  "[transition:background-color_var(--motion-duration-color-transition)_var(--motion-ease-easing)]",
  "group-focus-visible/menu-item:outline-2 group-focus-visible/menu-item:-outline-offset-2 group-focus-visible/menu-item:outline-stroke-focus-ring",
].join(" ");
export const MENU_PILL_ON =
  "group-hover/menu-item:bg-bg-layer-floating-pressed group-active/menu-item:bg-bg-layer-floating-pressed";

// 콘텐츠 층 — 아이콘 18 ↔ 이름 8. 누르는 동안만 준다(알약은 그대로)
export const MENU_ITEM_CONTENT =
  "relative flex min-w-0 flex-1 items-center gap-x2 [transition:scale_var(--motion-duration-pressed-scale)_var(--motion-ease-pressed-scale)]";
export const MENU_ITEM_CONTENT_PRESS =
  "group-active/menu-item:[scale:calc(1-2/var(--press-basis))] motion-reduce:group-active/menu-item:[scale:1]";
