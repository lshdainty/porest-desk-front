// Badge 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 재지 않는 값
//   prefixIcon.color  "currentColor" — 색 값이 아니다(아이콘이 글자색을 따른다는 규칙)
//   label.overflowX   "말줄임" — 문장
//   group.gap         묶음(BadgeGroup)은 견본의 뿌리(배지)가 아니라 따로 잴 자리가 없다 — badge.test.tsx 가 gap-x1 을 본다
export default {
  "root.alignItems": ["root", "exact", "align-items"],
  "root.gap": ["root", "px", "column-gap"],
  "root.maxWidth": ["root", "exact", "max-width"],
  "root.cursor": ["root", "exact", "cursor"],
  "root.minHeight": ["root", "px", "min-height"],
  "root.paddingX": ["root", "px", "padding-left"],
  "root.paddingY": ["root", "px", "padding-top"],
  "root.radius": ["root", "px", "border-top-left-radius"],
  "root.background": ["root", "color", "background-color"],
  "root.foreground": ["root", "color", "color"],
  // outline 의 안쪽 1px 선은 그림자(inset box-shadow)라 그 두께 · 색을 정하는 변수를 잰다
  "root.borderWidth": ["root", "px", "--badge-stroke-width"],
  "root.borderColor": ["root", "color", "--badge-stroke-color"],
  "prefixIcon.size": ["[data-slot=badge-prefix-icon] > svg", "px", "width"],
  "label.typography": ["[data-slot=badge-label]", "typography"],
  "label.fontWeight": ["[data-slot=badge-label]", "exact", "font-weight"],
};
