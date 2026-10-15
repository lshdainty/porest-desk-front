// Select 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다. 값은 src/shared/ds/spec/select.json.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 견본은 두 가지다 — 둘 다 틀(div)이 견본의 첫 요소라 모두 선택자로 잰다.
//   트리거 견본  틀 안에 트리거(button) 하나. 검사기가 틀 가운데(= 트리거)를 올리고 · 누르고 · 키보드 포커스를 준다(틀이 트리거로
//                넘긴다 — select.demo.tsx 의 TriggerSample). 고른 값 견본과 placeholder 견본이 따로라 값 · placeholder 는 data-placeholder 로 가른다.
//   목록 견본    틀(data-measure=list) 안에 열린 목록. 목록은 견본 안의 자리로 띄운다(Radix 가 감싼 div 안). 틀 가운데가 첫 선택지라
//                누름 견본이 선택지의 알약 바탕을 잰다. 트리거 값은 목록 견본에서 재지 않는다 — 누른 것이 트리거가 아니라 선택지라서다.
//
// 재지 않는 값 — select.test.tsx 가 클래스 · 속성으로 본다
//   trigger.borderColor · borderWidth  CSS 테두리가 아니라 안쪽 1px 그림자(box-shadow inset)와 ::after 의 2px(오류)다 — 검사기는
//     요소 자신의 계산된 스타일만 읽어 그림자를 테두리 값으로 풀지 못하고 가상 요소를 고르지 못한다
//   trigger.transition* · item.transition* · chevron 전환 · 모든 motion  시간 값(계산된 값은 "0.15s" 로 적히고 여러 속성이 한 transition 에 있다)
//   trigger.scale · item.scale  "2px 거리 축소" — 문장이다(누르는 순간 트리거 · 선택지를 재서 --press-basis 로 넘긴다)
//   content.width  "트리거 폭" — 문장이다(--radix-popover-trigger-width)
//   content.shadow · divider.*  계산된 box-shadow 는 색이 앞에 오는 다른 글이고, 묶음 사이 선(높이 1 · 색 · 좌우 16 · 아래 8)은 ::before 라
//     가상 요소다
//   content.marginTop · margin · maxHeight  Radix 의 자리 계산(sideOffset 8 · collisionPadding 8)과 남은 화면이라 견본 자리에 따라 값이
//     바뀐다 — 클래스 · 속성을 테스트가 본다
//   글꼴(fontFamily)  font-sans 가 src/index.css 의 --font-sans 로 풀려 스펙 글과 글자 그대로 맞지 않는다
const OWN = ":scope:not([data-measure=list])";
const TRIGGER = `${OWN} [data-slot=select-trigger]`;
const VALUE = `${OWN} [data-slot=select-trigger]:not([data-placeholder]) [data-slot=select-value]`;
const PLACEHOLDER = `${OWN} [data-slot=select-trigger][data-placeholder] [data-slot=select-value]`;
const ITEM = "[data-slot=select-item]";

export default {
  "trigger.background": [TRIGGER, "color", "background-color"],
  "trigger.cursor": [TRIGGER, "exact", "cursor"],
  "trigger.minHeight": [TRIGGER, "px", "min-height"],
  "trigger.radius": [TRIGGER, "px", "border-top-left-radius"],
  "trigger.paddingX": [TRIGGER, "px", "padding-left"],
  "trigger.gap": [TRIGGER, "px", "column-gap"],
  "value.foreground": [VALUE, "color", "color"],
  "value.fontWeight": [VALUE, "exact", "font-weight"],
  "value.typography": [VALUE, "typography"],
  "placeholder.foreground": [PLACEHOLDER, "color", "color"],
  "placeholder.fontWeight": [PLACEHOLDER, "exact", "font-weight"],
  "placeholder.typography": [PLACEHOLDER, "typography"],
  "prefixIcon.color": [
    `${OWN} [data-slot=select-prefix-icon] > svg`,
    "color",
    "color",
  ],
  "prefixIcon.size": [
    `${OWN} [data-slot=select-prefix-icon] > svg`,
    "px",
    "width",
  ],
  "chevron.color": [`${OWN} [data-slot=select-chevron]`, "color", "color"],
  "chevron.size": [`${OWN} [data-slot=select-chevron]`, "px", "width"],
  // 열린 상태의 셰브론 — 열린 목록 견본에서 잰다(트리거 견본은 닫혀 있다)
  "chevron.rotate": ["[data-slot=select-chevron]", "exact", "rotate"],
  "focusRing.width": [TRIGGER, "px", "outline-width"],
  "focusRing.offset": [TRIGGER, "px", "outline-offset"],
  "focusRing.color": [TRIGGER, "color", "outline-color"],
  "content.zIndex": ["[data-slot=select-content]", "exact", "z-index"],
  "content.background": [
    "[data-slot=select-content]",
    "color",
    "background-color",
  ],
  "content.radius": [
    "[data-slot=select-content]",
    "px",
    "border-top-left-radius",
  ],
  "content.paddingY": ["[data-slot=select-scroll]", "px", "padding-top"],
  "content.gap": ["[data-slot=select-scroll]", "px", "row-gap"],
  "item.paddingX": [ITEM, "px", "padding-left"],
  "item.paddingY": [ITEM, "px", "padding-top"],
  "item.gap": ["[data-slot=select-item-content]", "px", "column-gap"],
  // 첫 선택지는 설명이 없다(설명이 있으면 66 · 57 — 테스트가 본다)
  "item.height": [`${ITEM}:first-child`, "px", "height"],
  "item.cursor": [ITEM, "exact", "cursor"],
  "itemIcon.color": ["[data-slot=select-item-icon] > svg", "color", "color"],
  "itemIcon.size": ["[data-slot=select-item-icon] > svg", "px", "width"],
  "itemLabel.foreground": ["[data-slot=select-item-label]", "color", "color"],
  "itemLabel.fontWeight": [
    "[data-slot=select-item-label]",
    "exact",
    "font-weight",
  ],
  "itemLabel.typography": ["[data-slot=select-item-label]", "typography"],
  "itemDescription.foreground": [
    "[data-slot=select-item-description]",
    "color",
    "color",
  ],
  "itemDescription.typography": [
    "[data-slot=select-item-description]",
    "typography",
  ],
  "itemDescription.gap": [
    "span:has(> [data-slot=select-item-description])",
    "px",
    "row-gap",
  ],
  "indicator.color": ["[data-slot=select-indicator]", "color", "color"],
  "indicator.size": ["[data-slot=select-indicator]", "px", "width"],
  "indicator.opacity": ["[data-slot=select-indicator]", "exact", "opacity"],
  // 알약 — 첫 선택지의 바탕 층. 누름 견본은 틀 가운데(첫 선택지)를 누르고 있어 누름 색을 잰다
  "highlight.background": [
    `${ITEM}:first-child > [data-slot=select-pill]`,
    "color",
    "background-color",
  ],
  "highlight.radius": [
    `${ITEM}:first-child > [data-slot=select-pill]`,
    "px",
    "border-top-left-radius",
  ],
  "highlight.insetX": [
    `${ITEM}:first-child > [data-slot=select-pill]`,
    "px",
    "left",
  ],
  "groupLabel.foreground": ["[data-slot=select-group-label]", "color", "color"],
  "groupLabel.fontWeight": [
    "[data-slot=select-group-label]",
    "exact",
    "font-weight",
  ],
  "groupLabel.typography": ["[data-slot=select-group-label]", "typography"],
  "groupLabel.paddingX": [
    "[data-slot=select-group-label]",
    "px",
    "padding-left",
  ],
  "groupLabel.paddingY": [
    "[data-slot=select-group-label]",
    "px",
    "padding-top",
  ],
};
