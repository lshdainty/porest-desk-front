// Callout 을 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
// 닫기 버튼의 올림 · 누름 바탕(closeButton.background)은 검사기가 상자 가운데를 올리고 눌러 만들 수 없어 견본을 두지 않는다 —
// 잴 자리만 적어 둔다. 링크 · 닫기의 포커스 링도 같다(검사기는 상자에 초점을 준다).
export default {
  "root.minHeight": ["root", "px", "min-height"],
  "root.padding": ["root", "px", "padding-top"],
  "root.gap": ["root", "px", "column-gap"],
  "root.radius": ["root", "px", "border-top-left-radius"],
  "root.alignItems": ["root", "exact", "align-items"],
  "root.background": ["root", "color", "background-color"],
  "root.foreground": ["root", "color", "color"],
  "icon.size": ["[data-slot=callout-icon] > svg", "px", "width"],
  "title.typography": ["[data-slot=callout-title]", "typography"],
  "title.fontWeight": ["[data-slot=callout-title]", "exact", "font-weight"],
  "description.typography": ["[data-slot=callout-description]", "typography"],
  "description.fontWeight": [
    "[data-slot=callout-description]",
    "exact",
    "font-weight",
  ],
  "link.typography": ["[data-slot=callout-link]", "typography"],
  "link.fontWeight": ["[data-slot=callout-link]", "exact", "font-weight"],
  "link.textDecoration": [
    "[data-slot=callout-link]",
    "exact",
    "text-decoration-line",
  ],
  "suffixIcon.size": ["[data-slot=callout-chevron]", "px", "width"],
  "closeButton.size": ["[data-slot=callout-close]", "px", "width"],
  "closeButton.iconSize": ["[data-slot=callout-close] > svg", "px", "width"],
  "closeButton.radius": [
    "[data-slot=callout-close]",
    "px",
    "border-top-left-radius",
  ],
  "closeButton.background": [
    "[data-slot=callout-close]",
    "color",
    "background-color",
  ],
  "focusRing.width": ["root", "px", "outline-width"],
  "focusRing.offset": ["root", "px", "outline-offset"],
  "focusRing.color": ["root", "color", "outline-color"],
};
