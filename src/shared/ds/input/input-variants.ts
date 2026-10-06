import { cva } from "class-variance-authority";

/*
 * Porest Input 의 상자 변형 — 모양 · 크기. 수치 원본은 porest-design specs/components/input.yaml
 * (값은 src/shared/ds/spec/input.json). 컴포넌트와 규칙은 input.tsx 머리 주석이다
 * (컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
 *
 * 테두리는 상자 안쪽 1px(inset shadow), 포커스 · 오류의 2px 는 ::after 로 안쪽에 덧그린다 — 굵어져도 내용이
 * 밀리지 않고, 색만 100ms 로 나타난다(SEED). 읽기 전용이면 포커스 테두리가 없고, 오류는 포커스해도 빨간 2px 그대로다.
 * 크기마다 --text-input-px(좌우 여백 — 맨 앞 · 맨 뒤 요소가 가진다) · --text-input-icon(앞 · 뒤 아이콘) ·
 * --text-input-clear(지우기)를 정한다.
 */
export const textInputVariants = cva(
  [
    "relative flex w-full min-w-0 items-center overflow-hidden bg-transparent font-sans",
    "cursor-text data-[disabled]:cursor-not-allowed",
    "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:border-solid after:border-transparent after:content-['']",
    "after:[transition:border-color_var(--motion-duration-d2)_var(--motion-ease-easing)]",
    "[&:has(input:focus):not([data-invalid]):not([data-readonly])]:after:border-stroke-neutral-contrast",
    "data-[invalid]:after:border-stroke-critical-solid",
  ].join(" "),
  {
    variants: {
      variant: {
        outline:
          "shadow-[inset_0_0_0_1px_var(--color-stroke-neutral-weak)] after:border-2 data-[disabled]:bg-bg-disabled data-[readonly]:bg-bg-disabled",
        underline:
          "rounded-none shadow-[inset_0_-1px_0_0_var(--color-stroke-neutral-weak)] after:border-b-2",
      },
      size: {
        large: "",
        medium: "",
        responsive: "",
      },
    },
    compoundVariants: [
      {
        variant: "outline",
        size: "large",
        className:
          "min-h-13 gap-x2_5 rounded-r3 text-t5 [--text-input-px:var(--spacing-x4)] [--text-input-icon:20px] [--text-input-clear:22px]",
      },
      {
        variant: "outline",
        size: "medium",
        className:
          "min-h-10 gap-x2 rounded-r2 text-t4 [--text-input-px:var(--spacing-x3_5)] [--text-input-icon:16px] [--text-input-clear:18px]",
      },
      {
        variant: "outline",
        size: "responsive",
        className: [
          "min-h-13 gap-x2_5 rounded-r3 text-t5 [--text-input-px:var(--spacing-x4)] [--text-input-icon:20px] [--text-input-clear:22px]",
          "lg:min-h-10 lg:gap-x2 lg:rounded-r2 lg:text-t4 lg:[--text-input-px:var(--spacing-x3_5)] lg:[--text-input-icon:16px] lg:[--text-input-clear:18px]",
        ].join(" "),
      },
      {
        variant: "underline",
        size: "large",
        className:
          "min-h-10 gap-x2_5 py-x2 text-t6 [--text-input-px:0px] [--text-input-icon:24px] [--text-input-clear:22px]",
      },
      {
        variant: "underline",
        size: "medium",
        className:
          "min-h-[2.125rem] gap-x2 py-x1_5 text-t5 [--text-input-px:0px] [--text-input-icon:20px] [--text-input-clear:18px]",
      },
      {
        variant: "underline",
        size: "responsive",
        className: [
          "min-h-10 gap-x2_5 py-x2 text-t6 [--text-input-px:0px] [--text-input-icon:24px] [--text-input-clear:22px]",
          "lg:min-h-[2.125rem] lg:gap-x2 lg:py-x1_5 lg:text-t5 lg:[--text-input-icon:20px] lg:[--text-input-clear:18px]",
        ].join(" "),
      },
    ],
    defaultVariants: { variant: "outline", size: "responsive" },
  },
);

// 붙이개 · 지우기 — 맨 앞 · 맨 뒤면 상자의 좌우 여백을 바깥 여백으로 가진다
export const AFFIX_EDGE =
  "first:ml-[var(--text-input-px)] last:mr-[var(--text-input-px)]";
