// Textarea 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
// 견본은 상자(div[data-slot=textarea])고 입력은 그 안의 <textarea> 다 — 여백 · 높이는 입력이 가진다(SEED).
// 키보드 포커스는 검사기가 상자에 주면 견본이 입력으로 넘긴다(textarea.demo.tsx 의 passFocus).
//
// 재지 않는 값
//   root.borderColor · borderWidth — CSS 테두리가 아니라 안쪽 1px 그림자(box-shadow inset)와 ::after 의 2px(포커스 · 오류)다.
//     검사기는 요소 자신의 계산된 스타일만 읽어(그림자는 테두리 값이 아니고, 가상 요소는 못 고른다) 맞추지 못한다 —
//     textarea.test.tsx 가 클래스와 상태(data-invalid · data-readonly)를 본다.
//   root.transitionProperty · transitionDuration · transitionEasing — 전환도 ::after 에 있다(같은 까닭). 시간 값이기도 하다.
//   root.breakpoint — responsive 의 1280 은 미디어 쿼리(lg:)다. 견본은 크기를 large · medium 으로 정해 둔다(카탈로그는 1440 폭)
//     — 반응형 클래스는 textarea.test.tsx 가 본다.
//   value.maxHeight — "자리마다"(문장). 최대 높이에서 멈추고 스크롤하는 것은 textarea.test.tsx 가 본다.
//   placeholder.* — ::placeholder 가상 요소(같은 까닭). 색 클래스는 textarea.test.tsx 가 본다.
const VALUE = "[data-slot=textarea-value]";

export default {
  "root.background": ["root", "color", "background-color"],
  "root.cursor": ["root", "exact", "cursor"],
  "root.radius": ["root", "px", "border-top-left-radius"],
  "value.foreground": [VALUE, "color", "color"],
  "value.fontWeight": [VALUE, "exact", "font-weight"],
  "value.resize": [VALUE, "exact", "resize"],
  "value.paddingX": [VALUE, "px", "padding-left"],
  "value.paddingY": [VALUE, "px", "padding-top"],
  "value.typography": [VALUE, "typography"],
  "value.minHeight": [VALUE, "px", "min-height"],
};
