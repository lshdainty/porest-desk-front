// Help Bubble 을 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 견본의 첫 요소는 말풍선이 아니라 말풍선을 띄운 자리다(help-bubble.demo.tsx 의 OpenBubble) — Radix 는 말풍선을 감싼
// div(position: fixed) 안에 두므로 말풍선이 견본의 첫 요소가 될 수 없다. 그래서 모두 선택자로 잰다.
// 재지 않는 것 — root.offset(4) · root.margin(16) · arrow.margin(14)은 Radix 의 자리 계산(sideOffset · collisionPadding ·
// arrowPadding)이라 CSS 로 보이지 않는다. closeButton.touchTarget(44)은 ::before 라 검사기가 읽지 못하고, 누름(2px 거리
// 축소 · 150ms)은 문장이다. 누름 견본은 두지 않는다 — 검사기는 견본의 첫 요소(크기 0 인 자리)를 누른다.
const BUBBLE = "[data-slot=help-bubble-content]";
const CLOSE = "[data-slot=help-bubble-close]";

export default {
  "root.maxWidth": [BUBBLE, "px", "max-width"],
  "root.paddingY": [BUBBLE, "px", "padding-top"],
  "root.paddingX": [BUBBLE, "px", "padding-left"],
  "root.radius": [BUBBLE, "px", "border-top-left-radius"],
  "root.background": [BUBBLE, "color", "background-color"],
  "root.shadow": [BUBBLE, "exact", "box-shadow"],
  "root.zIndex": [BUBBLE, "exact", "z-index"],
  "arrow.width": ["[data-slot=help-bubble-arrow]", "px", "width"],
  "arrow.height": ["[data-slot=help-bubble-arrow]", "px", "height"],
  "title.typography": ["[data-slot=help-bubble-title]", "typography"],
  "title.fontWeight": ["[data-slot=help-bubble-title]", "exact", "font-weight"],
  "title.foreground": ["[data-slot=help-bubble-title]", "color", "color"],
  "description.typography": [
    "[data-slot=help-bubble-description]",
    "typography",
  ],
  "description.fontWeight": [
    "[data-slot=help-bubble-description]",
    "exact",
    "font-weight",
  ],
  "description.foreground": [
    "[data-slot=help-bubble-description]",
    "color",
    "color",
  ],
  // 제목 ↔ 설명 — 둘을 담은 글 칸(세로 flex)의 간격
  "description.gap": [":has(> [data-slot=help-bubble-title])", "px", "row-gap"],
  "closeButton.size": [CLOSE, "px", "width"],
  "closeButton.iconSize": [`${CLOSE} > svg`, "px", "width"],
  "closeButton.radius": [CLOSE, "px", "border-top-left-radius"],
  "closeButton.color": [CLOSE, "color", "color"],
  // 키보드 초점 — 닫기 버튼이 있으면 닫기 버튼(안쪽 링, 글자색), 없으면 말풍선(바깥 링, 브랜드). 두께 2 는 둘 다
  "focusRing.width": [
    `${CLOSE}, ${BUBBLE}:not(:has(${CLOSE}))`,
    "px",
    "outline-width",
  ],
  "focusRing.offset": [CLOSE, "px", "outline-offset"],
  "focusRing.color": [CLOSE, "color", "outline-color"],
  // 말풍선 링은 닫기 버튼이 없는 말풍선에만 — 닫기 버튼이 있으면 초점은 닫기 버튼에 선다
  "focusRing.rootOffset": [
    BUBBLE,
    "px",
    "outline-offset",
    { skipIf: "closeButton.size" },
  ],
  "focusRing.rootColor": [
    BUBBLE,
    "color",
    "outline-color",
    { skipIf: "closeButton.size" },
  ],
};
