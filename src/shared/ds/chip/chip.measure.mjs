// Chip 을 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 견본의 뿌리는 감싸개 하나다(칩 하나는 inline-flex 감싸개, 묶음은 폭을 가진 상자). 칩 · 입력값 칩은 그 안에서 선택자로 찾는다 —
// 감싸개에 포커스를 주면 데모가 첫 칩(입력값 칩은 지우기 버튼)으로 넘긴다(chip.demo.tsx 의 Frame). 묶음 · 스크롤 칸의 값은 같은
// 견본에서 묶음 선택자로 잰다 — 칩 견본에는 묶음이 없어 건너뛴다(그 반대도 같다: 빈 묶음 견본에는 칩이 없다).
//
// 재지 않는 값
//   root.borderColor · borderWidth       안쪽 1px box-shadow 라 재는 법(px · color · exact · typography)으로 읽히지 않는다.
//                                        고름 · 막힘의 테두리는 chip.test.tsx 가 클래스를 본다
//   root.transitionProperty · Duration · Easing  색 전환(150ms)과 축소 전환(scale)이 한 transition 속성에 이어 붙어 있어
//                                        "background-color, color, box-shadow" 한 줄과 같지 않다 — chip.test.tsx 가 본다
//   root.touchTarget · pressed 의 scale  44 × 44 영역(::before) · 2px 거리 축소는 문장이다 — chip.test.tsx 가 본다
//   removeButton.color                   "currentColor" — 색 값이 아니다(지우기가 글자색을 따른다는 규칙)
//   group.minHeight                      비었을 때만 — 빈 묶음 견본에서 잰다(:empty). 스크롤 묶음의 빈 칸은 chip.test.tsx
//   group.outlineWidth · Offset · Color  묶음이 포커스를 받을 때 — 감싸개의 포커스를 칩으로 넘기므로 묶음에는 닿지 않는다. chip.test.tsx
//   scrollRow.marginY · fog              "−6px"(유니코드 빼기) · 좌우 20px 라는 말 — chip.test.tsx 가 클래스를 본다
const CHIP = "[data-slot=chip], [data-slot=input-chip]";
const ONLY_CHIP = "[data-slot=chip]";
const PREFIX = "[data-slot=chip-prefix-icon] > svg";
const SUFFIX = "[data-slot=chip-suffix-icon] > svg";
// 아이콘만 있는 칩은 svg 가 칩의 바로 아래다(앞 · 뒤 아이콘은 span 으로 감싼다)
const ICON_ONLY = "[data-slot=chip] > svg";
const REMOVE = "[data-slot=input-chip-remove]";
// 줄바꿈 묶음 — 스크롤 묶음의 바깥 겹에는 간격이 없다(간격은 안쪽 스크롤 칸에 있다)
const GROUP = "[data-slot=chip-group]:not(:has(> [data-slot=chip-scroll-row]))";
const ROW = "[data-slot=chip-scroll-row]";

export default {
  "root.radius": [CHIP, "px", "border-top-left-radius"],
  "root.gap": [CHIP, "px", "column-gap"],
  "root.cursor": [ONLY_CHIP, "exact", "cursor"],
  "root.height": [CHIP, "px", "height"],
  "root.width": [CHIP, "px", "width"],
  "root.minWidth": [CHIP, "px", "min-width"],
  "root.paddingX": [CHIP, "px", "padding-left"],
  "root.background": [CHIP, "color", "background-color"],
  "root.foreground": [CHIP, "color", "color"],
  "label.typography": [CHIP, "typography"],
  "label.fontWeight": [CHIP, "exact", "font-weight"],
  "prefixIcon.size": [PREFIX, "px", "width"],
  "suffixIcon.size": [SUFFIX, "px", "width"],
  "icon.size": [ICON_ONLY, "px", "width"],
  "removeButton.size": [REMOVE, "px", "width"],
  "focusRing.width": [CHIP, "px", "outline-width"],
  "focusRing.offset": [CHIP, "px", "outline-offset"],
  "focusRing.color": [CHIP, "color", "outline-color"],
  "group.gap": [GROUP, "px", "column-gap"],
  "group.rowGap": [GROUP, "px", "row-gap"],
  "group.minHeight": [`${GROUP}:empty`, "px", "min-height"],
  "scrollRow.paddingX": [ROW, "px", "padding-left"],
  "scrollRow.paddingY": [ROW, "px", "padding-top"],
  "scrollRow.overflowX": [ROW, "exact", "overflow-x"],
  "scrollRow.scrollPadding": [ROW, "px", "scroll-padding-left"],
};
