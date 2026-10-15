// Bottom Navigation 을 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 견본의 뿌리는 바(<nav>)다. 바는 폰 폭 칸(transform 으로 fixed 를 가둔 칸) 안에 있어 left · bottom 이 칸 기준 값이다.
// 칸 · 아이콘 · 라벨은 첫 칸(홈)에서 잰다 — 그래서 "다른 탭"(selected: unselected) 견본은 지금 탭을 캘린더로 두고,
// "지금 탭"(selected) 견본은 홈을 지금 탭으로 둔다. 검사기가 바 가운데를 올리고 누르면 가운데 칸(+)이 눌린다 —
// 누름 상태는 + 의 원 색을 잰다. 포커스는 바에 준 키보드 포커스를 첫 칸으로 넘긴 것이다(bottom-navigation.demo.tsx 의 passFocus).
//
// 재지 않는 값(문장 · 합성 · 시간 · 위치 식이라 계산값이 스펙의 글과 같지 않은 것) — bottom-navigation.test.tsx 가 맡는다
//   root.shadow · borderColor · borderWidth   그림자 + 안쪽 1px 선이 한 box-shadow 로 합쳐져 있다
//   root.columns                              grid-cols-5 — 계산값이 칸 폭 다섯 개의 나열이다
//   root.marginBottom                         "max(14px, 안전 영역 − 6px)" 는 식 — 크로미움은 안전 영역이 0 이라 14 · 12 가 나온다(bottom 으로 잰다)
//   root.transition* · item.touchTarget · item.direction · label.lineClamp · label.display · notification.position · bodyInset.paddingBottom
//   *.scale · scaleDuration · scaleEasing     2px 거리 축소 — 누름의 scale 은 문장 · 시간
//   focusRing.offset(+)                       + 의 링은 원 바깥 2 — 스펙의 offset -2 는 칸의 것이다(+ 는 bottom-navigation.test.tsx)
const ITEM = "[data-slot=bottom-navigation-item]";
const LABEL = "[data-slot=bottom-navigation-label]";
const CIRCLE = "[data-slot=bottom-navigation-add-circle]";

export default {
  "root.maxWidth": ["root", "px", "max-width"],
  "root.radius": ["root", "px", "border-top-left-radius"],
  "root.background": ["root", "color", "background-color"],
  "root.gap": ["root", "px", "column-gap"],
  "root.zIndex": ["root", "exact", "z-index"],
  "root.height": ["root", "px", "height"],
  "root.marginX": ["root", "px", "left"],
  "root.paddingX": ["root", "px", "padding-left"],
  "root.paddingY": ["root", "px", "padding-top"],
  "item.gap": [ITEM, "px", "row-gap"],
  "item.cursor": [ITEM, "exact", "cursor"],
  "icon.size": [`${ITEM} svg`, "px", "width"],
  "icon.color": [ITEM, "color", "color"],
  "icon.strokeWidth": [`${ITEM} svg`, "px", "stroke-width"],
  "label.typography": [LABEL, "typography"],
  "label.fontWeight": [LABEL, "exact", "font-weight"],
  "label.foreground": [LABEL, "color", "color"],
  "addButton.size": [CIRCLE, "px", "width"],
  "addButton.radius": [CIRCLE, "px", "border-top-left-radius"],
  "addButton.background": [CIRCLE, "color", "background-color"],
  "addIcon.size": [`${CIRCLE} svg`, "px", "width"],
  "addIcon.color": [CIRCLE, "color", "color"],
  "addIcon.strokeWidth": [`${CIRCLE} svg`, "px", "stroke-width"],
  "focusRing.width": [ITEM, "px", "outline-width"],
  "focusRing.offset": [ITEM, "px", "outline-offset"],
  "focusRing.color": [ITEM, "color", "outline-color"],
};
