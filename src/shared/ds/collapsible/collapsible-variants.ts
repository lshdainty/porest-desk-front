import { cva } from "class-variance-authority";

/*
 * Groo Collapsible — 트리거는 Accordion 항목 하나의 모양(2026-10-10). 수치 원본은 groo-design specs/components/collapsible.yaml
 * (값은 src/shared/ds/spec/collapsible.json). 트리거 · 글 · 꺾쇠의 짜임은 accordion-variants.ts 를 그대로 쓰고, 이 파일은 놓인 면(surface)과
 * 펼친 내용의 여백만 가진다. 컴포넌트는 collapsible.tsx 다(컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
 *
 * 놓인 면 — card 는 Card 면(바닥 위 흰 면 + 1px · 모서리 16, 누름 바탕 · 펼친 내용을 모서리에서 자른다),
 * warning 은 트리거 위 1px 선(상자 폭 끝까지)이다.
 */

export const collapsibleVariants = cva("relative", {
  variants: {
    surface: {
      default: "",
      card: "overflow-hidden rounded-r4 border border-solid border-stroke-neutral-weak bg-bg-layer-default",
      warning: "border-0 border-t border-solid border-stroke-warning-weak",
    },
  },
  defaultVariants: { surface: "default" },
});

// 펼친 내용의 여백 — 위 0 · 좌우는 트리거와 같다(흰 면 · 카드 24, 경고 상자 16). 아래는 글 16 · 줄 목록 8(줄이 제 위아래 12 를 가진다) ·
// 카드 24(카드 안 여백 — 줄 목록이어도 24)
export const collapsiblePanelVariants = cva("pt-0", {
  variants: {
    surface: {
      default: "px-global-gutter",
      card: "px-global-gutter",
      warning: "px-x4",
    },
    layout: { text: "", rows: "" },
  },
  compoundVariants: [
    { surface: ["default", "warning"], layout: "text", class: "pb-x4" },
    { surface: ["default", "warning"], layout: "rows", class: "pb-x2" },
    { surface: "card", class: "pb-x6" },
  ],
  defaultVariants: { surface: "default", layout: "text" },
});
