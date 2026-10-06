// Radio Group 을 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
// 견본은 묶음(RadioGroup — role=radiogroup)이고 재는 줄은 첫 줄이다 — 줄(Radio)은 묶음 바로 아래 <label>, 동그라미
// (Radiomark)는 그 안의 [role=radio], 점은 동그라미 안의 span, 라벨은 줄 바로 아래 span. 키보드 포커스는 검사기가
// 묶음에 주면 Radix 가 고른 선택지(없으면 첫 선택지)로 옮긴다.
//
// 재지 않는 값 — radio-group.test.tsx 가 클래스 · 속성으로 본다
//   root.touchTarget  "44 × 44" — 문장이고, 누르는 영역은 줄의 ::before 라 검사기가 읽지 못한다(가상 요소)
//   radiomark.transitionProperty · transitionDuration · transitionEasing — 시간 값이다. 계산된 값은 "0.15s" 로 적히고,
//     누름 축소의 전환(scale — 스펙은 pressed 의 scaleDuration · scaleEasing)과 한 transition 에 있어 속성 목록에
//     scale 이 하나 더 붙는다
//   dot.transitionDuration · transitionEasing — 시간 값(계산된 값은 "0.15s"). 점의 전환 속성은 하나라 그대로 잰다
//   radiomark.scale · scaleDuration · scaleEasing — "세로 2px 축소" 는 문장, 나머지는 시간 값
//   label.fontFamily  font-sans 가 src/index.css 의 @theme inline --font-sans(옛 목록 "Pretendard Variable", Pretendard,
//     -apple-system … Inter, "Segoe UI", sans-serif)로 풀려 스펙 글(Pretendard, Inter, sans-serif)과 글자 그대로 맞지
//     않는다(첫 글꼴은 같은 Pretendard) — Button · Switch 도 재지 않는다
const ROW = ":scope > label:first-child";
const MARK = `${ROW} > [role=radio]`;
const DOT = `${MARK} > span`;
const LABEL = `${ROW} > span`;

export default {
  "group.gap": ["root", "px", "row-gap"],
  "root.gap": [ROW, "px", "column-gap"],
  "root.cursor": [ROW, "exact", "cursor"],
  "root.alignSelf": [ROW, "exact", "align-self"],
  "root.minHeight": [ROW, "px", "min-height"],
  "radiomark.size": [MARK, "px", "width"],
  "radiomark.radius": [MARK, "px", "border-top-left-radius"],
  "radiomark.background": [MARK, "color", "background-color"],
  "radiomark.borderColor": [MARK, "color", "border-top-color"],
  "radiomark.borderWidth": [MARK, "px", "border-top-width"],
  "dot.size": [DOT, "px", "width"],
  "dot.radius": [DOT, "px", "border-top-left-radius"],
  "dot.color": [DOT, "color", "background-color"],
  "dot.transitionProperty": [DOT, "exact", "transition-property"],
  "label.typography": [LABEL, "typography"],
  "label.fontWeight": [LABEL, "exact", "font-weight"],
  "label.foreground": [LABEL, "color", "color"],
  "focusRing.width": [MARK, "px", "outline-width"],
  "focusRing.offset": [MARK, "px", "outline-offset"],
  "focusRing.color": [MARK, "color", "outline-color"],
};
