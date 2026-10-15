// Select Box 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다. 값은 src/shared/ds/spec/select-box.json.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 견본은 틀(div) 안에 묶음 하나 + 상자 하나다(하나 고르기 · 여럿 고르기 둘 다). 틀이 견본의 첫 요소라 모두 선택자로 잰다.
// 검사기가 틀 가운데(= 상자의 누르는 자리)를 올리고 · 누르고, 키보드 포커스는 틀에 주면 견본이 컨트롤로 넘긴다
// (select-box.demo.tsx 의 Sample). 세로형은 묶음의 열 수가 아니라 상자의 layout 으로 정한다.
//
// 재지 않는 값 — select-box.test.tsx 가 클래스 · 속성으로 본다
//   root.borderColor · borderWidth  CSS 테두리가 아니라 안쪽 1px 그림자(box-shadow inset)와 ::after 의 2px(고름)다 — 검사기는
//     요소 자신의 계산된 스타일만 읽어 그림자를 테두리 값으로 풀지 못하고 가상 요소를 고르지 못한다
//   root.touchTarget  "44 × 44" — 문장이다(상자 전체가 누르는 영역 — 펼침을 뺀 label)
//   root.transition* · trigger.transition* · 모든 motion  시간 값 — 계산된 값은 "0.15s" 로 적히고 속성 목록은 여러 개다
//   trigger.scale  "2px 거리 축소" — 문장이다(누르는 순간 누르는 자리를 재서 --press-basis 로 넘긴다)
//   group.columns  "1 ~ 3" — 문장이다(grid-cols-1 · 2 · 3 을 테스트가 본다)
//   글꼴(fontFamily)  font-sans 가 src/index.css 의 --font-sans 로 풀려 스펙 글과 글자 그대로 맞지 않는다
const BOX = "[data-slot=select-box]";
const TRIGGER = "[data-slot=select-box-trigger]";
const CONTROL = "[data-select-box-control]";

export default {
  "root.radius": [BOX, "px", "border-top-left-radius"],
  "root.background": [BOX, "color", "background-color"],
  "trigger.gap": [TRIGGER, "px", "column-gap"],
  "trigger.grow": [TRIGGER, "exact", "flex-grow"],
  "trigger.cursor": [TRIGGER, "exact", "cursor"],
  "trigger.paddingY": [TRIGGER, "px", "padding-top"],
  "trigger.paddingX": [TRIGGER, "px", "padding-left"],
  "trigger.paddingLeft": [TRIGGER, "px", "padding-left"],
  "trigger.paddingRight": [TRIGGER, "px", "padding-right"],
  "trigger.alignItems": [TRIGGER, "exact", "align-items"],
  "content.gap": ["[data-slot=select-box-content]", "px", "gap"],
  "content.direction": [
    "[data-slot=select-box-content]",
    "exact",
    "flex-direction",
  ],
  "prefix.size": ["[data-slot=select-box-prefix] > svg", "px", "width"],
  "prefix.color": ["[data-slot=select-box-prefix] > svg", "color", "color"],
  "body.gap": ["[data-slot=select-box-body]", "px", "row-gap"],
  "body.paddingRight": ["[data-slot=select-box-body]", "px", "padding-right"],
  "label.typography": ["[data-slot=select-box-label]", "typography"],
  "label.fontWeight": ["[data-slot=select-box-label]", "exact", "font-weight"],
  "label.foreground": ["[data-slot=select-box-label]", "color", "color"],
  "label.gap": ["[data-slot=select-box-label]", "px", "column-gap"],
  "description.typography": [
    "[data-slot=select-box-description]",
    "typography",
  ],
  "description.foreground": [
    "[data-slot=select-box-description]",
    "color",
    "color",
  ],
  "control.size": [CONTROL, "px", "width"],
  "footer.paddingX": [
    "[data-slot=select-box-footer-inner]",
    "px",
    "padding-left",
  ],
  "footer.paddingBottom": [
    "[data-slot=select-box-footer-inner]",
    "px",
    "padding-bottom",
  ],
  "group.gapY": ["[data-slot=select-box-group]", "px", "row-gap"],
  "group.gapX": ["[data-slot=select-box-group]", "px", "column-gap"],
  "focusRing.width": [BOX, "px", "outline-width"],
  "focusRing.offset": [BOX, "px", "outline-offset"],
  "focusRing.color": [BOX, "color", "outline-color"],
};
