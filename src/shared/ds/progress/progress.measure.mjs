// Progress 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 견본은 묶음(Progress) 하나다 — 이름 줄 · 막대 · 금액 줄을 data-slot 으로 찾는다. 적지 않은 값 —
//   fill.width               "값 ÷ 목표" · "100%" — 비율이라 px 로 잴 수 없다. progress.test.tsx 가 style 의 폭을 본다
//   fill.transitionDuration  "300ms" — 계산된 값은 "0.3s" 로 적혀 글 그대로 맞출 수 없다
export default {
  "root.gap": ["root", "px", "row-gap"],
  "label.typography": ["[data-slot=progress-label]", "typography"],
  "label.fontWeight": ["[data-slot=progress-label]", "exact", "font-weight"],
  "label.foreground": ["[data-slot=progress-label]", "color", "color"],
  "status.typography": ["[data-slot=progress-status]", "typography"],
  "status.foreground": ["[data-slot=progress-status]", "color", "color"],
  "status.fontWeight": ["[data-slot=progress-status]", "exact", "font-weight"],
  "track.height": ["[data-slot=progress-track]", "px", "height"],
  "track.radius": [
    "[data-slot=progress-track]",
    "px",
    "border-top-left-radius",
  ],
  "track.background": [
    "[data-slot=progress-track]",
    "color",
    "background-color",
  ],
  "fill.radius": ["[data-slot=progress-fill]", "px", "border-top-left-radius"],
  "fill.background": ["[data-slot=progress-fill]", "color", "background-color"],
  "fill.transitionProperty": [
    "[data-slot=progress-fill]",
    "exact",
    "transition-property",
  ],
  "fill.transitionEasing": [
    "[data-slot=progress-fill]",
    "exact",
    "transition-timing-function",
  ],
  "amount.typography": ["[data-slot=progress-amount]", "typography"],
  "amount.foreground": ["[data-slot=progress-amount]", "color", "color"],
  "amount.numerals": [
    "[data-slot=progress-amount]",
    "exact",
    "font-variant-numeric",
  ],
};
