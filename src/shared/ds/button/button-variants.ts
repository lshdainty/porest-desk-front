import { cva } from "class-variance-authority";

/*
 * Porest Button — 구조는 SEED Action Button(2026-09-30). 수치 원본은 porest-design
 * specs/components/button.yaml(값은 src/shared/ds/spec/button.json).
 * porest-design recipes/shadcn/components/ui/button.tsx 를 첫 판으로 가져왔다(앱 적용 1A) — 이 파일은 변형 정의,
 * 컴포넌트는 button.tsx 다(컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
 *
 * Variants(7) — 한 화면의 강조 버튼(Solid)은 하나
 *   brandSolid     브랜드 색 채움 — 서비스 핵심 액션 하나(Desk 거래 추가 · HR 휴가 신청)
 *   neutralSolid   짙은 회색 채움 — 대부분의 CTA(저장 · 확인 · 다음). 기본값
 *   neutralWeak    옅은 회색 채움 — 대부분의 액션, CTA 옆 보조(취소)
 *   criticalSolid  빨강 채움 — 되돌릴 수 없는 작업의 확정(Alert Dialog)
 *   brandOutline   테두리 + 브랜드 글자 — neutralOutline 과 짝
 *   neutralOutline 테두리 + 본문 글자 — 가장 낮은 위계
 *   ghost          배경 없음 — ghostColor 로 글자색(neutral · neutralSubtle · brand · critical)
 *
 * Sizes(4) × layout(withText · iconOnly)
 *   xsmall 32(알약) · small 36 · medium 40(기본) · large 48 — 크기는 이름이 아니라 높이로 고른다.
 *
 * States
 *   hover = 누름 색(Tailwind v4 의 hover 는 hover 가능한 기기에서만). 누름은 누름 색 + 세로 2px 거리 축소 —
 *   배율 = (기준 − 2) ÷ 기준, 기준 = max(높이, 폭 ÷ 4, 24). 누르는 순간 크기를 재서 --press-basis 로 넘기고,
 *   크기마다 높이를 기본값으로 둔다. 모션 줄이기면 축소하지 않는다.
 *   disabled 는 전용 색(bg-disabled · fg-disabled) — 흐리게 하지 않는다.
 *   loading 은 누름 색 위 로딩 원 + 누르기 막기 + aria-busy. 라벨은 글자 · 아이콘 색만 투명하게 해 폭을 그대로 둔다 —
 *   자식을 따로 감싸지 않으므로 부르는 쪽의 [&>span] · [&>svg] 규칙이 그대로 먹는다. asChild 와 함께 쓰지 않는다.
 *   로딩 원은 Progress Circle(progress-circle.tsx) — size · tone inherit 로 이 버튼이 정한 --progress-size(14 · 14 · 16 · 18) ·
 *   --progress-thickness(2) · --progress-track · --progress-range 를 따른다. 장식이다(aria-hidden) — 버튼의 aria-busy 가 알린다.
 *
 * 누르는 영역은 보이는 크기와 따로 44×44 까지 넓힌다(::before).
 */
export const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center whitespace-nowrap font-sans font-bold",
    // 누르는 영역 44 — 보이는 상자보다 작으면 ::before 가 넓힌다
    "before:absolute before:left-1/2 before:top-1/2 before:h-full before:min-h-11 before:w-full before:min-w-11 before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']",
    // 색은 color-transition, 축소는 pressed-scale
    "[transition:background-color_var(--motion-duration-color-transition)_var(--motion-ease-easing),color_var(--motion-duration-color-transition)_var(--motion-ease-easing),scale_var(--motion-duration-pressed-scale)_var(--motion-ease-pressed-scale)]",
    "active:[scale:calc(1-2/var(--press-basis))] motion-reduce:active:[scale:1]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus-ring",
    "disabled:cursor-not-allowed disabled:[scale:1] disabled:bg-bg-disabled disabled:text-fg-disabled",
    // 로딩 — 라벨은 투명하게(폭 유지), 누름 축소 없음. 누르기는 onClick 에서 삼킨다. 로딩 원(Progress Circle)도 svg 지만 숨기지 않는다
    "aria-busy:cursor-progress aria-busy:text-transparent aria-busy:[&>svg:not([data-slot=progress-circle])]:invisible aria-busy:active:[scale:1]",
    // 로딩 원의 두께 — 크기와 상관없이 2(button.yaml progressCircle). 크기는 size 마다 --progress-size
    "[--progress-thickness:2px]",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        brandSolid:
          "bg-bg-brand-solid text-static-white hover:bg-bg-brand-solid-pressed active:bg-bg-brand-solid-pressed aria-busy:bg-bg-brand-solid-pressed [--progress-track:color-mix(in_srgb,var(--color-static-white)_30%,transparent)] [--progress-range:var(--color-static-white)]",
        neutralSolid:
          "bg-bg-neutral-inverted text-fg-neutral-inverted hover:bg-bg-neutral-inverted-pressed active:bg-bg-neutral-inverted-pressed aria-busy:bg-bg-neutral-inverted-pressed [--progress-track:color-mix(in_srgb,var(--color-fg-neutral-inverted)_30%,transparent)] [--progress-range:var(--color-fg-neutral-inverted)]",
        neutralWeak:
          "bg-bg-neutral-weak text-fg-neutral hover:bg-bg-neutral-weak-pressed active:bg-bg-neutral-weak-pressed aria-busy:bg-bg-neutral-weak-pressed [--progress-track:var(--color-gray-500)] [--progress-range:var(--color-fg-neutral)]",
        criticalSolid:
          "bg-bg-critical-solid text-static-white hover:bg-bg-critical-solid-pressed active:bg-bg-critical-solid-pressed aria-busy:bg-bg-critical-solid-pressed [--progress-track:color-mix(in_srgb,var(--color-static-white)_30%,transparent)] [--progress-range:var(--color-static-white)]",
        brandOutline:
          "border border-stroke-neutral-weak bg-transparent text-fg-brand hover:bg-bg-layer-default-pressed active:bg-bg-layer-default-pressed aria-busy:bg-transparent disabled:bg-transparent [--progress-track:var(--color-bg-brand-weak-pressed)] [--progress-range:var(--color-bg-brand-solid)]",
        neutralOutline:
          "border border-stroke-neutral-weak bg-transparent text-fg-neutral hover:bg-bg-layer-default-pressed active:bg-bg-layer-default-pressed aria-busy:bg-transparent disabled:bg-transparent [--progress-track:var(--color-gray-500)] [--progress-range:var(--color-fg-neutral)]",
        ghost:
          "bg-transparent text-fg-neutral hover:bg-bg-layer-default-pressed active:bg-bg-layer-default-pressed aria-busy:bg-bg-layer-default-pressed disabled:bg-transparent [--progress-track:var(--color-gray-500)] [--progress-range:var(--color-fg-neutral)]",
      },
      size: {
        xsmall: "h-8 rounded-full [--press-basis:32] [--progress-size:14px]",
        small: "h-9 rounded-r2 [--press-basis:36] [--progress-size:14px]",
        medium: "h-10 rounded-r2 [--press-basis:40] [--progress-size:16px]",
        // SEED large 는 52 — porest 는 48(button.md "SEED 와 다른 점")
        large: "h-12 rounded-r3 [--press-basis:48] [--progress-size:18px]",
      },
      layout: {
        withText: "",
        iconOnly: "",
      },
      // ghost 의 글자색(SEED ghost 의 color)
      ghostColor: {
        neutral: "",
        neutralSubtle: "",
        brand: "",
        critical: "",
      },
      // 가장자리 맞춤(SEED bleed) — 그 방향 가로 여백만 0. 여백은 크기 × 배치 조합 뒤에서 뺀다(아래)
      flush: {
        left: "",
        right: "",
      },
    },
    compoundVariants: [
      // 크기 × 배치 — 여백 · 간격 · 글자 · 아이콘(button.yaml)
      {
        size: "xsmall",
        layout: "withText",
        className: "px-x3_5 py-x1_5 gap-x1 text-t3 [&_svg]:size-3.5",
      },
      {
        size: "small",
        layout: "withText",
        className: "px-x3_5 py-x2 gap-x1 text-t4 [&_svg]:size-3.5",
      },
      {
        size: "medium",
        layout: "withText",
        className: "px-x4 py-x2_5 gap-x1_5 text-t4 [&_svg]:size-4",
      },
      {
        size: "large",
        layout: "withText",
        className: "px-x5 py-x3 gap-x2 text-t6 [&_svg]:size-[22px]",
      },
      {
        size: "xsmall",
        layout: "iconOnly",
        className: "w-8 p-x1_5 [&_svg]:size-3.5",
      },
      {
        size: "small",
        layout: "iconOnly",
        className: "w-9 p-x2 [&_svg]:size-4",
      },
      {
        size: "medium",
        layout: "iconOnly",
        className: "w-10 p-x2_5 [&_svg]:size-[18px]",
      },
      {
        size: "large",
        layout: "iconOnly",
        className: "w-12 p-x3 [&_svg]:size-[22px]",
      },
      // 가장자리 맞춤 — 크기 × 배치의 px 보다 뒤에 둬야 tailwind-merge 가 pl-0 · pr-0 을 남긴다
      { flush: "left", className: "pl-0" },
      { flush: "right", className: "pr-0" },
      // ghost 글자색
      {
        variant: "ghost",
        ghostColor: "neutralSubtle",
        className: "text-fg-neutral-subtle",
      },
      { variant: "ghost", ghostColor: "brand", className: "text-fg-brand" },
      {
        variant: "ghost",
        ghostColor: "critical",
        className: "text-fg-critical",
      },
      // flush ghost 는 텍스트 버튼 — 배경 없이 글자색으로만 반응한다(button.md "porest 에만 있는 것")
      {
        variant: "ghost",
        flush: ["left", "right"],
        className:
          "text-fg-neutral-subtle hover:bg-transparent hover:text-fg-neutral active:bg-transparent active:text-fg-neutral focus-visible:text-fg-neutral",
      },
    ],
    defaultVariants: {
      variant: "neutralSolid",
      size: "medium",
      layout: "withText",
      ghostColor: "neutral",
    },
  },
);
