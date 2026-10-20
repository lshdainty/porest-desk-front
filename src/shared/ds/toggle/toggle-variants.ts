import { cva } from "class-variance-authority";

/*
 * Groo Toggle 의 클래스 — 켜고 끄는 아이콘 단추. 수치 원본은 groo-design specs/components/toggle.yaml
 * (값은 src/shared/ds/spec/toggle.json). 무엇이 언제 바뀌는지는 toggle.tsx 머리 주석이다
 * (컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
 */

// 단추 — 보이는 40 · 모서리 8 · 누르는 영역 44(::before). 바탕은 켬 · 끔과 상관없이 투명이고 호버 · 누름에만 칠한다
export const toggleVariants = cva(
  [
    "relative inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-r2 border-0 bg-transparent p-0",
    // 누르는 영역 44 — 보이는 40 둘레로 2 씩
    "before:absolute before:left-1/2 before:top-1/2 before:size-11 before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']",
    // 아이콘 20 · 끔 선 2 · 켬 선 2.5(막혀도 그대로)
    "[&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 [&_svg]:[stroke-width:2] aria-pressed:[&_svg]:[stroke-width:2.5]",
    // 바탕은 color-transition, 축소는 pressed-scale
    "[transition:background-color_var(--motion-duration-color-transition)_var(--motion-ease-easing),scale_var(--motion-duration-pressed-scale)_var(--motion-ease-pressed-scale)]",
    "[--press-basis:40] active:[scale:calc(1-2/var(--press-basis))] motion-reduce:active:[scale:1]",
    // 키보드 포커스 링 2px · 띄움 2px — 색은 톤마다(채움 위는 흰색)
    "focus-visible:outline-2 focus-visible:outline-offset-2",
    "disabled:cursor-not-allowed disabled:bg-transparent disabled:text-fg-disabled disabled:[scale:1]",
  ].join(" "),
  {
    variants: {
      tone: {
        // 끔 흐린 색 · 켬 진한 색(막히면 켬도 fg-disabled — enabled 에만 건다), 호버 · 누름은 같은 바탕, 링 stroke-focus-ring
        default:
          "text-fg-neutral-muted enabled:aria-pressed:text-fg-neutral hover:bg-bg-layer-default-pressed active:bg-bg-layer-default-pressed focus-visible:outline-stroke-focus-ring",
        // 브랜드 채움 위 — 켬 · 끔 모두 흰 아이콘, 바탕은 칠하지 않는다(축소만). 링도 흰색 — stroke-focus-ring 은 채움에 묻힌다
        inverted: "text-static-white focus-visible:outline-static-white",
      },
    },
    defaultVariants: { tone: "default" },
  },
);
