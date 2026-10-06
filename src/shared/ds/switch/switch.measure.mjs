// Switch 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
// 견본은 Switch 한 줄(<label>)이다 — 스위치(Switchmark)는 [role=switch], 엄지는 그 안의 span, 라벨은 줄 바로 아래 span.
// 키보드 포커스는 검사기가 줄(<label>)에 주면 브라우저가 스위치로 넘긴다.
// 재지 않는 값 — 끈 채 막힌 트랙의 안쪽 선(borderColor · borderWidth)은 테두리가 아니라 inset-ring(box-shadow)이라
// 검사기의 재는 법(px · color · exact · typography)으로 읽지 못한다. 전환 · 누름 축소 · 누르는 영역(44 — ::before)은
// 시간 · 문장 값이다. 글꼴(fontFamily)은 토큰 --font-sans 에 system-ui 가 끼어 있어 스펙 글(Pretendard, Inter, sans-serif)과
// 글자 그대로 맞지 않는다 — Button 도 재지 않는다.
export default {
  "root.cursor": ["root", "exact", "cursor"],
  "root.alignSelf": ["root", "exact", "align-self"],
  "root.minHeight": ["root", "px", "min-height"],
  "root.gap": ["root", "px", "column-gap"],
  "switchmark.width": ["[role=switch]", "px", "width"],
  "switchmark.height": ["[role=switch]", "px", "height"],
  "switchmark.padding": ["[role=switch]", "px", "padding-top"],
  "switchmark.radius": ["[role=switch]", "px", "border-top-left-radius"],
  "switchmark.background": ["[role=switch]", "color", "background-color"],
  "thumb.size": ["[role=switch] > span", "px", "width"],
  "thumb.radius": ["[role=switch] > span", "px", "border-top-left-radius"],
  "thumb.color": ["[role=switch] > span", "color", "background-color"],
  "thumb.scale": ["[role=switch] > span", "exact", "scale"],
  "thumb.translateX": ["[role=switch] > span", "px", "translate"],
  "label.typography": [":scope > span", "typography"],
  "label.fontWeight": [":scope > span", "exact", "font-weight"],
  "label.foreground": [":scope > span", "color", "color"],
  "focusRing.width": ["[role=switch]", "px", "outline-width"],
  "focusRing.offset": ["[role=switch]", "px", "outline-offset"],
  "focusRing.color": ["[role=switch]", "color", "outline-color"],
};
