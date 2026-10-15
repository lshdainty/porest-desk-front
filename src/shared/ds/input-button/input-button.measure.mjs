// Input Button 을 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
// 견본의 첫 요소는 상자(div[data-slot=input-button])다 — 크기 · 모서리 · 여백 · 사이는 상자가 갖고, 바탕 · 커서 · 포커스 링은
// 상자를 덮는 배경 층 버튼(button[data-slot=input-button-trigger])이 그린다(SEED). 누름은 상자 가운데를 눌러 버튼의 :active 로 잰다.
// 키보드 포커스는 검사기가 상자에 주면 견본이 버튼으로 넘긴다(input-button.demo.tsx 의 passFocus).
//
// 재지 않는 값
//   root.borderColor · borderWidth — CSS 테두리가 아니라 안쪽 1px 그림자(box-shadow inset)와 ::after 의 2px(오류)다.
//     검사기는 요소 자신의 계산된 스타일만 읽어(그림자는 테두리 값이 아니고, 가상 요소는 못 고른다) 맞추지 못한다 —
//     input-button.test.tsx 가 클래스와 상태(data-invalid)를 본다.
//   root.transitionProperty · transitionDuration · transitionEasing — 시간 값이고, 오류 전환은 ::after 에 있다(같은 까닭).
//   root.touchTarget — "상자 전체"(문장). 배경 층 버튼이 상자를 덮는 것은 input-button.test.tsx 가 본다.
//   root.scale · root.scaleDuration · root.scaleEasing · clearButton.scale — 누름의 축소 배율 · 시간(문장 · 시간). 기준 길이를
//     --press-basis 로 넘기는 것과 모션 줄이기는 input-button.test.tsx 가 본다.
//   root.breakpoint — responsive 의 1280 은 미디어 쿼리(lg:)다. 견본은 크기를 large · medium 으로 정해 둔다(카탈로그는 1440 폭)
//     — 반응형 클래스는 input-button.test.tsx 가 본다.
//   focusRing 은 키보드 포커스(focused)에서만 잰다 — 마우스 · 터치 포커스에는 링이 없다(focus-visible).
const TRIGGER = "[data-slot=input-button-trigger]";
const VALUE = "[data-slot=input-button-value]:not([data-placeholder])";
const PLACEHOLDER = "[data-slot=input-button-value][data-placeholder]";
const PREFIX_ICON = "[data-slot=input-button-prefix-icon]";
const SUFFIX_ICON = "[data-slot=input-button-suffix-icon]";
const CLEAR = "[data-slot=input-button-clear]";

export default {
  "root.background": [TRIGGER, "color", "background-color"],
  "root.cursor": [TRIGGER, "exact", "cursor"],
  "root.minHeight": ["root", "px", "min-height"],
  "root.radius": ["root", "px", "border-top-left-radius"],
  "root.paddingX": ["root", "px", "padding-left"],
  "root.gap": ["root", "px", "column-gap"],
  "value.foreground": [VALUE, "color", "color"],
  "value.fontWeight": [VALUE, "exact", "font-weight"],
  "value.typography": [VALUE, "typography"],
  "placeholder.foreground": [PLACEHOLDER, "color", "color"],
  "placeholder.fontWeight": [PLACEHOLDER, "exact", "font-weight"],
  "placeholder.typography": [PLACEHOLDER, "typography"],
  "prefixIcon.color": [PREFIX_ICON, "color", "color"],
  "prefixIcon.size": [`${PREFIX_ICON} > svg`, "px", "width"],
  "prefixText.foreground": [
    "[data-slot=input-button-prefix]",
    "color",
    "color",
  ],
  "prefixText.typography": ["[data-slot=input-button-prefix]", "typography"],
  "suffixText.foreground": [
    "[data-slot=input-button-suffix]",
    "color",
    "color",
  ],
  "suffixText.typography": ["[data-slot=input-button-suffix]", "typography"],
  "suffixIcon.color": [SUFFIX_ICON, "color", "color"],
  "suffixIcon.size": [`${SUFFIX_ICON} > svg`, "px", "width"],
  "clearButton.color": [CLEAR, "color", "color"],
  "clearButton.radius": [CLEAR, "px", "border-top-left-radius"],
  "clearButton.size": [`${CLEAR} > svg`, "px", "width"],
  "focusRing.width": [TRIGGER, "px", "outline-width"],
  "focusRing.offset": [TRIGGER, "px", "outline-offset"],
  "focusRing.color": [TRIGGER, "color", "outline-color"],
};
