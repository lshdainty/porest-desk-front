// Tag Group 을 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 견본의 뿌리는 묶음이다. item 은 첫 항목에서 잰다 — 견본은 묶음의 tone · weight(또는 첫 항목의 것)를 조합에 적는다.
//
// 재지 않는 값
//   icon.color                   "currentColor" — 색 값이 아니다(아이콘이 항목 글자색을 따른다는 규칙)
//   separator.glyph · srSeparator.glyph  글 — CSS 가 아니다(tag-group.test.tsx 가 " · " · ", " 를 본다)
//   root.overflowX               문장(낱말 단위 줄바꿈 · 한 줄 말줄임 — tag-group.test.tsx 가 클래스를 본다)
const ITEM = "[data-slot=tag-group-item]";
const SEPARATOR = "[data-slot=tag-group-separator]";
const ICON =
  "[data-slot=tag-group-item-prefix-icon] > svg, [data-slot=tag-group-item-suffix-icon] > svg";

export default {
  // 아이콘 ↔ 글 — 앞 아이콘의 오른쪽 바깥 여백(뒤 아이콘은 왼쪽 — 같은 값)
  "item.gap": ["[data-slot=tag-group-item-prefix-icon]", "px", "margin-right"],
  "item.typography": [ITEM, "typography"],
  "item.foreground": [ITEM, "color", "color"],
  "item.fontWeight": [ITEM, "exact", "font-weight"],
  "item.shrink": [ITEM, "exact", "flex-shrink"],
  "icon.size": [ICON, "px", "width"],
  "separator.foreground": [SEPARATOR, "color", "color"],
  "separator.fontWeight": [SEPARATOR, "exact", "font-weight"],
  "separator.typography": [SEPARATOR, "typography"],
  "separator.shrink": [SEPARATOR, "exact", "flex-shrink"],
};
