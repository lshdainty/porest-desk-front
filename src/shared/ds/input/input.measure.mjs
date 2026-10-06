// Input 을 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
// 견본은 상자(div[data-slot=text-input])다 — 입력 · 붙이개 · 지우기는 그 안의 data-slot 으로 찾는다.
// 키보드 포커스는 검사기가 상자에 주면 견본이 입력으로 넘긴다(input.demo.tsx 의 passFocus).
// 상자의 좌우 여백(root.paddingX)은 상자가 아니라 맨 앞 · 맨 뒤 요소가 가진다 — 입력이면 안쪽 여백, 붙이개 · 지우기면
// 바깥 여백(맨 앞 · 맨 뒤의 입력이 그 여백까지 눌리게). 그래서 입력이 맨 앞인 견본에서 입력의 왼쪽 안쪽 여백으로 잰다
// (앞 붙이개가 있는 견본은 재지 않는다 — 붙이개의 바깥 여백은 input.test.tsx 가 클래스로 본다).
//
// 재지 않는 값
//   root.borderColor · borderWidth · borderBottomWidth — CSS 테두리가 아니라 안쪽 1px 그림자(box-shadow inset)와 ::after 의
//     2px(포커스 · 오류)다. 검사기는 요소 자신의 계산된 스타일만 읽어(그림자는 테두리 값이 아니고, 가상 요소는 못 고른다)
//     맞추지 못한다 — input.test.tsx 가 클래스와 상태(data-invalid · data-readonly)를 본다.
//   root.transitionProperty · transitionDuration · transitionEasing — 색이 바뀌는 것이 ::after 의 테두리라 전환도 ::after 에
//     있다(같은 까닭). 시간 값이기도 하다.
//   root.breakpoint — responsive 의 1280 은 미디어 쿼리(lg:)다, 계산된 스타일 값이 아니다. 견본은 크기를 large · medium 으로
//     정해 둔다(카탈로그는 1440 폭) — 반응형 클래스는 input.test.tsx 가 본다.
//   placeholder.* — ::placeholder 가상 요소(같은 까닭). 색 클래스는 input.test.tsx 가 본다.
const VALUE = "[data-slot=text-input-value]";
const PREFIX_ICON = "[data-slot=text-input-prefix-icon] > svg";
const PREFIX = "[data-slot=text-input-prefix]";
const SUFFIX = "[data-slot=text-input-suffix]";
const SUFFIX_ICON = "[data-slot=text-input-suffix-icon] > svg";
const CLEAR = "[data-slot=text-input-clear]";

export default {
  "root.background": ["root", "color", "background-color"],
  "root.cursor": ["root", "exact", "cursor"],
  "root.minHeight": ["root", "px", "min-height"],
  "root.radius": ["root", "px", "border-top-left-radius"],
  "root.gap": ["root", "px", "column-gap"],
  "root.paddingY": ["root", "px", "padding-top"],
  "root.paddingX": [`${VALUE}:first-child`, "px", "padding-left"],
  "value.foreground": [VALUE, "color", "color"],
  "value.fontWeight": [VALUE, "exact", "font-weight"],
  "value.typography": [VALUE, "typography"],
  "prefixIcon.color": [PREFIX_ICON, "color", "color"],
  "prefixIcon.size": [PREFIX_ICON, "px", "width"],
  "prefixText.foreground": [PREFIX, "color", "color"],
  "prefixText.fontWeight": [PREFIX, "exact", "font-weight"],
  "prefixText.typography": [PREFIX, "typography"],
  "suffixText.foreground": [SUFFIX, "color", "color"],
  "suffixText.fontWeight": [SUFFIX, "exact", "font-weight"],
  "suffixText.typography": [SUFFIX, "typography"],
  "suffixIcon.color": [SUFFIX_ICON, "color", "color"],
  "suffixIcon.size": [SUFFIX_ICON, "px", "width"],
  "clearButton.color": [CLEAR, "color", "color"],
  "clearButton.radius": [CLEAR, "px", "border-top-left-radius"],
  "clearButton.size": [CLEAR, "px", "width"],
};
