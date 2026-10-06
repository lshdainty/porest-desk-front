// Notification Badge 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 견본의 뿌리는 붙을 대상(notification-badge-target)이고, 스펙의 root 는 그 위에 겹친 점 · 숫자다.
// label 은 숫자 알약에만 있다 — 공통 규칙의 label.fontWeight 도 점에서는 재지 않는다(data-size=large 만 찾는다).
//
// 재지 않는 값
//   root.position  "absolute — …" — 문장(아이콘 · 숫자의 왼쪽 아래 꼭짓점 (아이콘 폭 − 8, 14) 도 문장이다)
const BADGE = "[data-slot=notification-badge]";
const COUNT = "[data-slot=notification-badge][data-size=large]";

export default {
  "root.radius": [BADGE, "px", "border-top-left-radius"],
  "root.size": [BADGE, "px", "width"],
  "root.background": [BADGE, "color", "background-color"],
  "root.minWidth": [BADGE, "px", "min-width"],
  "root.minHeight": [BADGE, "px", "min-height"],
  "root.paddingX": [BADGE, "px", "padding-left"],
  "root.top": [BADGE, "px", "top"],
  "root.right": [BADGE, "px", "right"],
  // 글 끝 ↔ 점 · 알약 — 글 끝(left 100%)에서 띄운 바깥 여백
  "root.gap": [BADGE, "px", "margin-left"],
  "label.fontWeight": [COUNT, "exact", "font-weight"],
  "label.typography": [COUNT, "typography"],
  "label.foreground": [COUNT, "color", "color"],
  "label.numerals": [COUNT, "exact", "font-variant-numeric"],
};
