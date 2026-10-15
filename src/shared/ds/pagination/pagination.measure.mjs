// Pagination 을 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다. 값은 src/shared/ds/spec/pagination.json.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 견본의 뿌리는 견본 틀(div)이고 넘김 줄(nav)은 그 안에 있다 — 모든 값을 data-slot 으로 찾는다. 칸은 번호 칸(쪽 번호 · 지금 쪽) ·
// 화살표 · 생략 · 빈 칸이고, 호버 · 누름 · 포커스는 칸마다 달라 견본 틀이 data-measure 로 어느 칸을 보는지 알린다(:scope 는 틀).
//   data-measure 없음   쉬는 줄 — 번호 칸(다른 쪽) · 이전 화살표를 잰다
//   data-measure=item   호버 · 누름 · 포커스를 받는 번호 칸(다른 쪽) — 화살표는 잰 값이 아니다
//   data-measure=arrow  호버 · 누름 · 포커스를 받는 이전 화살표 — 번호 칸은 잰 값이 아니다
//   data-measure=current  지금 쪽 칸 — 지금 쪽의 채움 · 글자만 잰다
// 호버 · 누름은 검사기가 틀 가운데를 올리고 누르므로, 그 견본은 40 × 40 틀 안에 줄을 놓아 그 칸이 틀 가운데에 오게 짰다
// (pagination.demo.tsx 의 OnCell). 키보드 포커스는 틀이 그 칸으로 넘긴다. 칸 수 7 · 9 는 화면 폭 480 이 가르는데 검사 창은 1440 이라
// 9칸만 본다 — 7칸(root.width 280)은 pagination.test.tsx 가 matchMedia 를 바꿔 본다.
//
// 재지 않는 값 — pagination.test.tsx 가 클래스 · 속성으로 본다
//   item.touchTarget  "40 × 44" — 문장이다(::before 가 위아래로 2 씩 넓힌다)
//   item.transitionProperty · transitionDuration · transitionEasing · scale  칸의 전환은 색과 축소 둘이 한 transition 에 있어 계산된
//     속성이 "background-color, scale" 이고 스펙의 색 규칙("background-color")과 글자 그대로 맞지 않는다. 시간 값이고
//     "2px 거리 축소" 는 문장이다
//   글꼴(fontFamily)  font-sans 가 src/index.css 의 --font-sans 로 풀려 스펙 글과 글자 그대로 맞지 않는다
const PG = "[data-slot=pagination]";
const ROW = "[data-slot=pagination-row]";
const OTHER =
  ":scope:not([data-measure=arrow]):not([data-measure=current]) [data-slot=pagination-item]:not([data-current])";
const CURRENT =
  ":scope[data-measure=current] [data-slot=pagination-item][data-current]";
const ITEM = `${OTHER}, ${CURRENT}`;
const LABEL = `${OTHER} > [data-slot=pagination-label], ${CURRENT} > [data-slot=pagination-label]`;
const ARROW =
  ":scope:not([data-measure=item]):not([data-measure=current]) [data-slot=pagination-previous]";
const FOCUSED =
  "[data-slot=pagination-item]:focus-visible, [data-slot=pagination-previous]:focus-visible";

export default {
  "root.gap": [ROW, "px", "column-gap"],
  "root.justifyContent": [PG, "exact", "justify-content"],
  "root.marginTop": [PG, "px", "margin-top"],
  "root.width": [ROW, "px", "width"],
  "item.size": [ITEM, "px", "width"],
  "item.radius": [ITEM, "px", "border-top-left-radius"],
  "item.background": [ITEM, "color", "background-color"],
  "item.cursor": [ITEM, "exact", "cursor"],
  "label.typography": [LABEL, "typography"],
  "label.fontWeight": [LABEL, "exact", "font-weight"],
  "label.foreground": [LABEL, "color", "color"],
  "label.numerals": [LABEL, "exact", "font-variant-numeric"],
  "arrow.size": [ARROW, "px", "width"],
  "arrow.radius": [ARROW, "px", "border-top-left-radius"],
  "arrow.iconSize": [`${ARROW} > svg`, "px", "width"],
  "arrow.color": [ARROW, "color", "color"],
  "arrow.background": [ARROW, "color", "background-color"],
  "arrow.cursor": [ARROW, "exact", "cursor"],
  "ellipsis.size": ["[data-slot=pagination-ellipsis]", "px", "width"],
  "ellipsis.iconSize": ["[data-slot=pagination-ellipsis] > svg", "px", "width"],
  "ellipsis.color": ["[data-slot=pagination-ellipsis]", "color", "color"],
  "empty.size": ["[data-slot=pagination-empty]", "px", "width"],
  "focusRing.width": [FOCUSED, "px", "outline-width"],
  "focusRing.offset": [FOCUSED, "px", "outline-offset"],
  "focusRing.color": [FOCUSED, "color", "outline-color"],
};
