import { cva } from "class-variance-authority";

/*
 * Porest Callout 의 상자 변형 — 톤 · 상호작용. 수치 원본은 porest-design specs/components/callout.yaml
 * (값은 src/shared/ds/spec/callout.json). 컴포넌트와 규칙은 callout.tsx 머리 주석이다
 * (컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
 */

// 상자 — 톤 바탕 · 글자. Actionable 은 톤의 누름 바탕(호버 · 누름) + 상자 전체 축소 + 상자 둘레 링
export const calloutVariants = cva(
  "relative flex min-h-[50px] w-full items-center gap-x3 rounded-r2_5 p-x3_5 text-left font-sans",
  {
    variants: {
      tone: {
        neutral: "bg-bg-neutral-weak text-fg-neutral",
        informative: "bg-bg-informative-weak text-fg-informative-contrast",
        positive: "bg-bg-positive-weak text-fg-positive-contrast",
        warning: "bg-bg-warning-weak text-fg-warning-contrast",
        critical: "bg-bg-critical-weak text-fg-critical-contrast",
      },
      interaction: {
        display: "",
        dismissible: "",
        actionable: [
          "cursor-pointer [--press-basis:50]",
          "[transition:background-color_var(--motion-duration-color-transition)_var(--motion-ease-easing),scale_var(--motion-duration-pressed-scale)_var(--motion-ease-pressed-scale)]",
          "active:[scale:calc(1-2/var(--press-basis))] motion-reduce:active:[scale:1]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus-ring",
        ].join(" "),
      },
    },
    compoundVariants: [
      {
        interaction: "actionable",
        tone: "neutral",
        className:
          "hover:bg-bg-neutral-weak-pressed active:bg-bg-neutral-weak-pressed",
      },
      {
        interaction: "actionable",
        tone: "informative",
        className:
          "hover:bg-bg-informative-weak-pressed active:bg-bg-informative-weak-pressed",
      },
      {
        interaction: "actionable",
        tone: "positive",
        className:
          "hover:bg-bg-positive-weak-pressed active:bg-bg-positive-weak-pressed",
      },
      {
        interaction: "actionable",
        tone: "warning",
        className:
          "hover:bg-bg-warning-weak-pressed active:bg-bg-warning-weak-pressed",
      },
      {
        interaction: "actionable",
        tone: "critical",
        className:
          "hover:bg-bg-critical-weak-pressed active:bg-bg-critical-weak-pressed",
      },
    ],
    defaultVariants: { tone: "neutral", interaction: "display" },
  },
);
