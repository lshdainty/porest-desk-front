import { cva } from "class-variance-authority";

/*
 * Porest Page Banner 의 띠 변형 — 톤 · 바탕 · 상호작용. 수치 원본은 porest-design specs/components/page-banner.yaml
 * (값은 src/shared/ds/spec/page-banner.json). 컴포넌트와 규칙은 page-banner.tsx 머리 주석이다
 * (컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
 */

// 띠 — 바탕 · 글자는 바탕 × 톤, Actionable 은 그 바탕의 누름 색(호버 · 누름) + 안쪽 링
export const pageBannerVariants = cva(
  "group/page-banner relative flex min-h-10 w-full rounded-none px-global-gutter py-x2_5 text-left font-sans",
  {
    variants: {
      tone: {
        neutral: "",
        informative: "",
        positive: "",
        warning: "",
        critical: "",
      },
      variant: { weak: "", solid: "" },
      interaction: {
        display: "",
        dismissible: "",
        actionable: [
          "cursor-pointer [--press-basis:40] [transition:background-color_var(--motion-duration-color-transition)_var(--motion-ease-easing)]",
          "focus-visible:outline-2 focus-visible:-outline-offset-2",
        ].join(" "),
      },
    },
    compoundVariants: [
      // 옅은 바탕 — Callout 과 같은 짝
      {
        variant: "weak",
        tone: "neutral",
        className: "bg-bg-neutral-weak text-fg-neutral",
      },
      {
        variant: "weak",
        tone: "informative",
        className: "bg-bg-informative-weak text-fg-informative-contrast",
      },
      {
        variant: "weak",
        tone: "positive",
        className: "bg-bg-positive-weak text-fg-positive-contrast",
      },
      {
        variant: "weak",
        tone: "warning",
        className: "bg-bg-warning-weak text-fg-warning-contrast",
      },
      {
        variant: "weak",
        tone: "critical",
        className: "bg-bg-critical-weak text-fg-critical-contrast",
      },
      // 짙은 바탕 — 흰 글(neutral 은 반전 짝)
      {
        variant: "solid",
        tone: "neutral",
        className: "bg-bg-neutral-inverted text-fg-neutral-inverted",
      },
      {
        variant: "solid",
        tone: "informative",
        className: "bg-bg-informative-solid text-static-white",
      },
      {
        variant: "solid",
        tone: "positive",
        className: "bg-bg-positive-solid text-static-white",
      },
      {
        variant: "solid",
        tone: "warning",
        className: "bg-bg-warning-solid text-static-white",
      },
      {
        variant: "solid",
        tone: "critical",
        className: "bg-bg-critical-solid text-static-white",
      },
      // Actionable — 링 색(옅은 바탕은 브랜드 링, 짙은 바탕은 띠 글자색) · 호버 · 누름 바탕
      {
        interaction: "actionable",
        variant: "weak",
        className: "focus-visible:outline-stroke-focus-ring",
      },
      {
        interaction: "actionable",
        variant: "solid",
        className: "focus-visible:outline-current",
      },
      {
        interaction: "actionable",
        variant: "weak",
        tone: "neutral",
        className:
          "hover:bg-bg-neutral-weak-pressed active:bg-bg-neutral-weak-pressed",
      },
      {
        interaction: "actionable",
        variant: "weak",
        tone: "informative",
        className:
          "hover:bg-bg-informative-weak-pressed active:bg-bg-informative-weak-pressed",
      },
      {
        interaction: "actionable",
        variant: "weak",
        tone: "positive",
        className:
          "hover:bg-bg-positive-weak-pressed active:bg-bg-positive-weak-pressed",
      },
      {
        interaction: "actionable",
        variant: "weak",
        tone: "warning",
        className:
          "hover:bg-bg-warning-weak-pressed active:bg-bg-warning-weak-pressed",
      },
      {
        interaction: "actionable",
        variant: "weak",
        tone: "critical",
        className:
          "hover:bg-bg-critical-weak-pressed active:bg-bg-critical-weak-pressed",
      },
      {
        interaction: "actionable",
        variant: "solid",
        tone: "neutral",
        className:
          "hover:bg-bg-neutral-inverted-pressed active:bg-bg-neutral-inverted-pressed",
      },
      {
        interaction: "actionable",
        variant: "solid",
        tone: "informative",
        className:
          "hover:bg-bg-informative-solid-pressed active:bg-bg-informative-solid-pressed",
      },
      {
        interaction: "actionable",
        variant: "solid",
        tone: "positive",
        className:
          "hover:bg-bg-positive-solid-pressed active:bg-bg-positive-solid-pressed",
      },
      {
        interaction: "actionable",
        variant: "solid",
        tone: "warning",
        className:
          "hover:bg-bg-warning-solid-pressed active:bg-bg-warning-solid-pressed",
      },
      {
        interaction: "actionable",
        variant: "solid",
        tone: "critical",
        className:
          "hover:bg-bg-critical-solid-pressed active:bg-bg-critical-solid-pressed",
      },
    ],
    defaultVariants: {
      tone: "neutral",
      variant: "weak",
      interaction: "display",
    },
  },
);
