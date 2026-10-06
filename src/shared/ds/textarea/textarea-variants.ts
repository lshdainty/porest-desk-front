import { cva } from "class-variance-authority";

/*
 * Porest Textarea 의 변형 — 상자(크기)와 입력(크기 × 자동 높이). 수치 원본은 porest-design
 * specs/components/textarea.yaml(값은 src/shared/ds/spec/textarea.json). 컴포넌트와 규칙은 textarea.tsx 머리 주석이다
 * (컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
 *
 * 상자 · 테두리 · 상태는 Input 의 outline 과 같다 — 안쪽 1px(inset shadow), 포커스 · 오류 2px 는 ::after 로 덧그린다.
 * 크기마다 --textarea-px · --textarea-py(입력의 좌우 · 위아래 여백 — 여백은 입력이 가진다, SEED)를 정한다.
 */
export const textareaVariants = cva(
  [
    "relative flex w-full min-w-0 overflow-hidden bg-transparent font-sans shadow-[inset_0_0_0_1px_var(--color-stroke-neutral-weak)]",
    "cursor-text data-[disabled]:cursor-not-allowed data-[disabled]:bg-bg-disabled data-[readonly]:bg-bg-disabled",
    "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:border-2 after:border-solid after:border-transparent after:content-['']",
    "after:[transition:border-color_var(--motion-duration-d2)_var(--motion-ease-easing)]",
    "[&:has(textarea:focus):not([data-invalid]):not([data-readonly])]:after:border-stroke-neutral-contrast",
    "data-[invalid]:after:border-stroke-critical-solid",
  ].join(" "),
  {
    variants: {
      size: {
        large:
          "rounded-r3 text-t5 [--textarea-px:var(--spacing-x4)] [--textarea-py:var(--spacing-x3_5)]",
        medium:
          "rounded-r2 text-t4 [--textarea-px:var(--spacing-x3_5)] [--textarea-py:var(--spacing-x3)]",
        responsive: [
          "rounded-r3 text-t5 [--textarea-px:var(--spacing-x4)] [--textarea-py:var(--spacing-x3_5)]",
          "lg:rounded-r2 lg:text-t4 lg:[--textarea-px:var(--spacing-x3_5)] lg:[--textarea-py:var(--spacing-x3)]",
        ].join(" "),
      },
    },
    defaultVariants: { size: "responsive" },
  },
);

// 입력(<textarea>)의 최소 높이 — 자동 높이는 3줄, 고정 높이는 2줄
export const textareaValueVariants = cva(
  "block w-full resize-none border-0 bg-transparent px-[var(--textarea-px)] py-[var(--textarea-py)] outline-none [font:inherit] disabled:cursor-not-allowed",
  {
    variants: {
      size: { large: "", medium: "", responsive: "" },
      autoSize: { true: "overflow-y-hidden", false: "overflow-y-auto" },
    },
    compoundVariants: [
      { autoSize: true, size: "large", className: "min-h-[5.875rem]" },
      { autoSize: true, size: "medium", className: "min-h-[5.125rem]" },
      {
        autoSize: true,
        size: "responsive",
        className: "min-h-[5.875rem] lg:min-h-[5.125rem]",
      },
      { autoSize: false, size: "large", className: "min-h-[4.5rem]" },
      { autoSize: false, size: "medium", className: "min-h-[3.875rem]" },
      {
        autoSize: false,
        size: "responsive",
        className: "min-h-[4.5rem] lg:min-h-[3.875rem]",
      },
    ],
    defaultVariants: { size: "responsive", autoSize: true },
  },
);
