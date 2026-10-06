// Segmented Control 을 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
// 견본은 트랙(role=radiogroup)이고 칸은 셋이다 — 칸 · 글 · 포커스 링은 가운데 칸(둘째 칸)에서 잰다. 검사기가 트랙 가운데를
// 올리고 · 누르면 가운데 칸이, 트랙에 포커스를 주면 Radix 가 고른 칸(가운데)으로 옮긴다(데모 머리 주석).
// 재지 않는 값 — 고른 알약 · 칸의 테두리(borderColor · borderWidth)는 안쪽 1px box-shadow 라 검사기의 재는 법
// (px · color · exact · typography)으로 읽지 못한다. 알림 점의 간격(2)은 left: calc(100% + 2px) 라 그 자체로 읽히지 않는다.
// 트랙 폭 · 칸 수 · 누르는 영역 · 누름 축소 · 시간은 문장 · 시간 값이다.
const ITEM = "[data-slot=segmented-control-item]:nth-of-type(2)";
const LABEL = `${ITEM} [data-slot=segmented-control-label]`;
const INDICATOR = "[data-slot=segmented-control-indicator]";
const NOTIFICATION = "[data-slot=segmented-control-notification]";

export default {
  "root.padding": ["root", "px", "padding-top"],
  "root.radius": ["root", "px", "border-top-left-radius"],
  "root.background": ["root", "color", "background-color"],
  "item.minHeight": [ITEM, "px", "min-height"],
  "item.paddingX": [ITEM, "px", "padding-left"],
  "item.paddingY": [ITEM, "px", "padding-top"],
  "item.radius": [ITEM, "px", "border-top-left-radius"],
  "item.cursor": [ITEM, "exact", "cursor"],
  "item.transitionProperty": [ITEM, "exact", "transition-property"],
  "item.background": [ITEM, "color", "background-color"],
  "label.typography": [LABEL, "typography"],
  "label.fontWeight": [LABEL, "exact", "font-weight"],
  "label.foreground": [LABEL, "color", "color"],
  "label.textAlign": [LABEL, "exact", "text-align"],
  "indicator.background": [INDICATOR, "color", "background-color"],
  "indicator.radius": [INDICATOR, "px", "border-top-left-radius"],
  "indicator.inset": [INDICATOR, "px", "top"],
  "indicator.transitionProperty": [INDICATOR, "exact", "transition-property"],
  "notification.size": [NOTIFICATION, "px", "width"],
  "notification.radius": [NOTIFICATION, "px", "border-top-left-radius"],
  "notification.background": [NOTIFICATION, "color", "background-color"],
  "focusRing.width": [ITEM, "px", "outline-width"],
  "focusRing.offset": [ITEM, "px", "outline-offset"],
  "focusRing.color": [ITEM, "color", "outline-color"],
};
