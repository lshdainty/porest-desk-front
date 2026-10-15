// List Header(목록 제목)를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다. 값은 src/shared/ds/spec/list-header.json,
// 견본(spec="list-header")은 list.demo.tsx 에 있다 — 목록 제목은 List 와 한 폴더라 잴 자리도 이 폴더에 둔다(검사기는 스펙 이름의
// 폴더에 없으면 다른 폴더의 <스펙>.measure.mjs 를 찾는다). [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 견본의 뿌리는 목록 제목 자체다. 제목은 글자 · 여백이 뿌리에 있고, 오른쪽 작은 버튼은 부르는 쪽이 둔다(제목 ↔ 버튼 간격은 뿌리의 gap).
// 재지 않는 값 — 글꼴(fontFamily): font-sans 가 src/index.css 의 --font-sans 로 풀려 스펙 글과 글자 그대로 맞지 않는다(Button · Switch 도 재지 않는다)
export default {
  "root.paddingX": ["root", "px", "padding-left"],
  "root.paddingY": ["root", "px", "padding-top"],
  "root.gap": ["root", "px", "column-gap"],
  "root.typography": ["root", "typography"],
  "root.fontWeight": ["root", "exact", "font-weight"],
  "root.foreground": ["root", "color", "color"],
};
