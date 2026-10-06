/*
 * Porest Help Bubble 의 말풍선 모양 — Help Bubble · Tooltip 한 벌. 수치 원본은 porest-design
 * specs/components/help-bubble.yaml(값은 src/shared/ds/spec/help-bubble.json — Tooltip 과 한 파일).
 * porest-design recipes/shadcn/components/ui/help-bubble.tsx 를 첫 판으로 가져왔다(앱 적용 1A) — 이 파일은 모양 정의,
 * 컴포넌트는 help-bubble.tsx 다(컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침). 화살표(BubbleArrow)는 컴포넌트라 그쪽에 있다.
 * Tooltip(tooltip.tsx)이 BUBBLE · BUBBLE_TITLE · BUBBLE_POSITION · BubbleArrow 를 그대로 쓴다.
 */

// 말풍선 — 최대 280(가용 폭까지) · 위아래 10 · 좌우 12 · 모서리 12 · 짙은 바탕 · 그림자 없음 · z 210. 화살표 끝을 기준점으로 커진다.
// outline-none 을 두지 않는다 — Tailwind 의 outline-none 은 --tw-outline-style 을 none 으로 만들어 Help Bubble 의 초점 링(ROOT_RING)을 지운다
// 열림 상태 이름은 Popover 가 open, Tooltip 이 delayed-open · instant-open 이다(Tailwind 는 소스의 글자 그대로를 읽으므로 셋을 다 적는다).
// data-instant(툴팁이 이어서 열림 · 바로 닫음)면 모션이 없다. 길이는 --tw-animation-duration 으로 준다 — duration-* 는 transition-duration 도
// 바꿔(transition-property 의 처음 값은 all) 테마를 바꿀 때 색까지 200ms 로 번지게 한다
export const BUBBLE = [
  "relative z-(--z-tooltip) box-border w-max max-w-[min(280px,var(--radix-popper-available-width,280px))] rounded-r3 bg-bg-neutral-inverted px-x3 py-x2_5",
  "font-sans text-fg-neutral-inverted break-keep [overflow-wrap:break-word]",
  "origin-[var(--radix-popper-transform-origin)]",
  "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:[--tw-animation-duration:var(--motion-duration-d4)] data-[state=open]:ease-[var(--motion-ease-enter)] motion-safe:data-[state=open]:zoom-in-90",
  "data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:[--tw-animation-duration:var(--motion-duration-d4)] data-[state=delayed-open]:ease-[var(--motion-ease-enter)] motion-safe:data-[state=delayed-open]:zoom-in-90",
  "data-[state=instant-open]:animate-in data-[state=instant-open]:fade-in-0 data-[state=instant-open]:[--tw-animation-duration:var(--motion-duration-d4)] data-[state=instant-open]:ease-[var(--motion-ease-enter)] motion-safe:data-[state=instant-open]:zoom-in-90",
  "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:[--tw-animation-duration:var(--motion-duration-d4)] data-[state=closed]:ease-[var(--motion-ease-easing)]",
  "data-[instant]:animate-none!",
].join(" ");

// 제목 — t3 13 / 18 · 700. 툴팁의 글도 이 자리다. 줄바꿈 문자는 그대로
export const BUBBLE_TITLE = "m-0 block whitespace-pre-line text-t3 font-bold";
// 설명 — t3 · 400
export const BUBBLE_DESCRIPTION =
  "m-0 block whitespace-pre-line text-t3 font-normal";

// 화살표 끝 ↔ 트리거 4(Radix 는 화살표 높이 8 을 더해 몸통을 12 띄운다) · 화살표 ↔ 말풍선 모서리 14 · 화면 가장자리 16
export const BUBBLE_POSITION = {
  sideOffset: 4,
  arrowPadding: 14,
  collisionPadding: 16,
} as const;
