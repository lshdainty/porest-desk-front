// Checkbox 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
// 견본은 묶음(CheckboxGroup)이고 재는 줄은 첫 줄이다 — 줄(Checkbox)은 묶음 바로 아래 <label>, 칸(Checkmark)은 그 안의
// [role=checkbox], 라벨은 줄 바로 아래 span, 아이콘은 칸 안에서 보이는 것이다(체크 · 가로줄을 둘 다 그려 두고 일부
// 선택이면 체크를, 아니면 가로줄을 숨긴다). 키보드 포커스는 견본이 묶음에서 칸으로 넘긴다(checkbox.demo.tsx 의 passFocus).
//
// 재지 않는 값 — checkbox.test.tsx 가 클래스 · 속성으로 본다
//   root.touchTarget  "44 × 44" — 문장이고, 누르는 영역은 줄의 ::before 라 검사기가 읽지 못한다(가상 요소)
//   checkmark.transitionProperty · transitionDuration · transitionEasing — 시간 값이다. 계산된 값은 "0.15s" 로 적히고,
//     누름 축소의 전환(scale — 스펙은 pressed 의 scaleDuration · scaleEasing)과 한 transition 에 있어 속성 목록에
//     scale 이 하나 더 붙는다
//   checkmark.scale · scaleDuration · scaleEasing — "세로 2px 축소" 는 문장, 나머지는 시간 값
//   icon.glyph  어떤 아이콘인지(Check · Minus · none) — CSS 값이 아니다
//   label.fontFamily  font-sans 가 src/index.css 의 @theme inline --font-sans(옛 목록 "Pretendard Variable", Pretendard,
//     -apple-system … Inter, "Segoe UI", sans-serif)로 풀려 스펙 글(Pretendard, Inter, sans-serif)과 글자 그대로 맞지
//     않는다(첫 글꼴은 같은 Pretendard) — Button · Switch 도 재지 않는다
const ROW = ":scope > label:first-child";
const MARK = `${ROW} > [role=checkbox]`;
const ICON = `${MARK}:not([data-state=indeterminate]) svg.lucide-check, ${MARK}[data-state=indeterminate] svg.lucide-minus`;
const LABEL = `${ROW} > span`;

export default {
  "group.gap": ["root", "px", "row-gap"],
  "root.gap": [ROW, "px", "column-gap"],
  "root.cursor": [ROW, "exact", "cursor"],
  "root.alignSelf": [ROW, "exact", "align-self"],
  "root.minHeight": [ROW, "px", "min-height"],
  "checkmark.size": [MARK, "px", "width"],
  "checkmark.radius": [MARK, "px", "border-top-left-radius"],
  "checkmark.background": [MARK, "color", "background-color"],
  "checkmark.borderColor": [MARK, "color", "border-top-color"],
  "checkmark.borderWidth": [MARK, "px", "border-top-width"],
  "icon.size": [ICON, "px", "width"],
  "icon.color": [ICON, "color", "color"],
  "label.typography": [LABEL, "typography"],
  "label.fontWeight": [LABEL, "exact", "font-weight"],
  "label.foreground": [LABEL, "color", "color"],
  "focusRing.width": [MARK, "px", "outline-width"],
  "focusRing.offset": [MARK, "px", "outline-offset"],
  "focusRing.color": [MARK, "color", "outline-color"],
};
