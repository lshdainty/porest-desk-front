// Page Banner 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
// 띠의 gap · alignItems 는 안의 내용 층(page-banner-inner)이 그린다 — Actionable 을 누르면 그 층만 주므로
// 아이콘 · 글 · 화살표 · 닫기를 한 층에 모았다. 글 버튼 · 닫기의 포커스 링은 검사기가 띠에 초점을 주므로 재지 못한다.
export default {
  "root.minHeight": ["root", "px", "min-height"],
  "root.paddingX": ["root", "px", "padding-left"],
  "root.paddingY": ["root", "px", "padding-top"],
  "root.gap": ["[data-slot=page-banner-inner]", "px", "column-gap"],
  "root.radius": ["root", "px", "border-top-left-radius"],
  "root.alignItems": ["[data-slot=page-banner-inner]", "exact", "align-items"],
  "root.background": ["root", "color", "background-color"],
  "root.foreground": ["root", "color", "color"],
  "icon.size": ["[data-slot=page-banner-icon] > svg", "px", "width"],
  "icon.marginTop": ["[data-slot=page-banner-icon]", "px", "margin-top"],
  "content.gap": ["[data-slot=page-banner-content]", "px", "row-gap"],
  "content.justifyContent": [
    "[data-slot=page-banner-content]",
    "exact",
    "justify-content",
  ],
  "title.typography": ["[data-slot=page-banner-title]", "typography"],
  "title.fontWeight": ["[data-slot=page-banner-title]", "exact", "font-weight"],
  "description.typography": [
    "[data-slot=page-banner-description]",
    "typography",
  ],
  "description.fontWeight": [
    "[data-slot=page-banner-description]",
    "exact",
    "font-weight",
  ],
  "button.typography": ["[data-slot=page-banner-button]", "typography"],
  "button.fontWeight": [
    "[data-slot=page-banner-button]",
    "exact",
    "font-weight",
  ],
  "button.radius": [
    "[data-slot=page-banner-button]",
    "px",
    "border-top-left-radius",
  ],
  "suffixIcon.size": ["[data-slot=page-banner-chevron]", "px", "width"],
  "closeButton.size": ["[data-slot=page-banner-close]", "px", "width"],
  "closeButton.iconSize": [
    "[data-slot=page-banner-close] > svg",
    "px",
    "width",
  ],
  "closeButton.radius": [
    "[data-slot=page-banner-close]",
    "px",
    "border-top-left-radius",
  ],
  "focusRing.width": ["root", "px", "outline-width"],
  "focusRing.offset": ["root", "px", "outline-offset"],
  "focusRing.color": ["root", "color", "outline-color"],
};
