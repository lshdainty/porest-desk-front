// Result Section 을 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
// 버튼 크기(primaryButton · secondaryButton.buttonSize — "medium 40" · "small 36")는 글로 된 값이라 재지 않는다 —
// 버튼 모양은 Button 의 견본이 잰다(이 컴포넌트는 variant · size 만 고른다 — result-section.test.tsx).
export default {
  "root.paddingX": ["root", "px", "padding-left"],
  "root.paddingY": ["root", "px", "padding-top"],
  "root.alignItems": ["root", "exact", "align-items"],
  "root.textAlign": ["root", "exact", "text-align"],
  "asset.size": ["[data-slot=result-section-asset] > svg", "px", "width"],
  "asset.marginBottom": [
    "[data-slot=result-section-asset]",
    "px",
    "margin-bottom",
  ],
  "asset.color": ["[data-slot=result-section-asset]", "color", "color"],
  "title.typography": ["[data-slot=result-section-title]", "typography"],
  "title.fontWeight": [
    "[data-slot=result-section-title]",
    "exact",
    "font-weight",
  ],
  "title.foreground": ["[data-slot=result-section-title]", "color", "color"],
  "description.typography": [
    "[data-slot=result-section-description]",
    "typography",
  ],
  "description.fontWeight": [
    "[data-slot=result-section-description]",
    "exact",
    "font-weight",
  ],
  "description.foreground": [
    "[data-slot=result-section-description]",
    "color",
    "color",
  ],
  "description.marginTop": [
    "[data-slot=result-section-description]",
    "px",
    "margin-top",
  ],
  "actions.gap": ["[data-slot=result-section-actions]", "px", "row-gap"],
  "actions.marginTop": [
    "[data-slot=result-section-actions]",
    "px",
    "margin-top",
  ],
};
