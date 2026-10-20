/*
 * Groo Menu 의 모양 — 수치 원본은 groo-design specs/components/menu.yaml(값은 src/shared/ds/spec/menu.json).
 * groo-design recipes/shadcn/components/ui/menu.tsx 를 첫 판으로 가져왔다 — 이 파일은 모양 정의,
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

// 줄 — 위아래 10 · 좌우 16. 키보드 위치는 ::after 의 링(알약이 다 들어온 자리 — 좌우 8 · 모서리 12 · 안쪽 2px, 바탕 없음)이다.
// 링은 그 자리에 고정이라 들어오는 중인 호버 알약과 잠깐 폭이 다를 수 있다(menu.yaml focusRing)
export const MENU_ITEM = [
  "group/menu-item relative flex cursor-pointer select-none items-center px-x4 py-x2_5 outline-none scroll-my-x2",
  "after:pointer-events-none after:absolute after:inset-y-0 after:inset-x-x2 after:rounded-r3 after:content-['']",
  "focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-stroke-focus-ring",
  "data-[disabled]:cursor-not-allowed",
].join(" ");

// 알약 — 줄은 그대로, 마우스를 올리거나(마우스가 있는 기기에서만) 누르면 줄 폭 전체에서 좌우 0 → 8 들어오며 모서리 0 → 12 로
// 둥글어지고 칠해진다 — 150ms(SEED menu-item, 2026-10-15 Q-009-3 안 B). 떠나면 거꾸로 펴지며 투명해진다. 막힌 줄에는 없다
export const MENU_PILL =
  "pointer-events-none absolute inset-y-0 inset-x-0 rounded-none bg-transparent [transition:background-color_var(--motion-duration-color-transition)_var(--motion-ease-easing),inset_var(--motion-duration-color-transition)_var(--motion-ease-easing),border-radius_var(--motion-duration-color-transition)_var(--motion-ease-easing)]";
export const MENU_PILL_ON =
  "group-hover/menu-item:inset-x-x2 group-hover/menu-item:rounded-r3 group-hover/menu-item:bg-bg-layer-floating-pressed group-active/menu-item:inset-x-x2 group-active/menu-item:rounded-r3 group-active/menu-item:bg-bg-layer-floating-pressed";

// 콘텐츠 층 — 아이콘 18 ↔ 이름 8. 누르는 동안만 준다(알약은 그대로)
export const MENU_ITEM_CONTENT =
  "relative flex min-w-0 flex-1 items-center gap-x2 [transition:scale_var(--motion-duration-pressed-scale)_var(--motion-ease-pressed-scale)]";
export const MENU_ITEM_CONTENT_PRESS =
  "group-active/menu-item:[scale:calc(1-2/var(--press-basis))] motion-reduce:group-active/menu-item:[scale:1]";
