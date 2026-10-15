// Menu 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 견본의 첫 요소(root)는 무대다(overlay-stage.tsx) — 메뉴는 무대 안에 열린 표면이라 모두 선택자로 잰다. 호버 · 누름 견본은
// 첫 요소가 첫 줄 위의 작은 상자라 검사기가 그 줄을 올리고 누른다. 견본은 조합의 톤에 맞는 줄만 담는다 — 첫 줄이 곧 재는 줄이다.
// 호버 · 누름 바탕은 알약 요소의 배경 · inset · 모서리다(쉴 때 0 · 0, 호버 · 누름에 8 · 12 — 150ms 전환, Q-009-3).
//
// 재지 않는 것(문장 · 계산 · 의사 요소 · 모션이라 menu.test.tsx 가 맡는다)
//   - content.shadow   계산된 box-shadow 는 색이 앞에 오는 다른 글이라 스펙 글과 같은지 글로 비교할 수 없다(모서리 · 바탕은 잰다)
//   - content.offset(8) · content.align · content.maxHeight   Radix 의 자리 계산(sideOffset · align · available-height)이라 CSS 로 보이지 않는다
//   - item.transition*   알약 바탕의 전환이라 알약 요소에 있다 — 계산값이 "0.15s" 라 스펙 글("150ms")과 글로 비교되지 않는다
//   - focusRing.*   키보드 링은 줄의 ::after(알약이 다 들어온 자리 8 · 12 에 고정)라 의사 요소를 읽지 못하는 검사기가 잴 수 없다(클래스를 테스트가 맞춘다)
//   - divider.*   묶음 사이 선은 ::before 의사 요소라 검사기가 읽지 못한다(클래스를 테스트가 맞춘다)
//   - pressed item.scale · scaleDuration · scaleEasing   "콘텐츠 2px 거리 축소" 는 문장이다(기준 길이를 누르는 순간 잰다)
//   - 열림 · 닫힘 모션(150ms · 100ms)   시간은 문장이다
const CONTENT = "[data-slot=menu-content]";
const ITEM = "[data-slot=menu-item]";
const PILL = "[data-slot=menu-item-pill]";
const LABEL = "[data-slot=menu-item-label]";
const DESC = "[data-slot=menu-item-description]";
const GROUP_LABEL = "[data-slot=menu-group-label]";

export default {
  "content.width": [CONTENT, "px", "width"],
  "content.background": [CONTENT, "color", "background-color"],
  "content.radius": [CONTENT, "px", "border-top-left-radius"],
  // 메뉴 위아래 8 — 줄을 담은 스크롤 자리의 안쪽 여백
  "content.paddingY": ["[data-slot=menu-scroll]", "px", "padding-top"],
  "content.zIndex": [CONTENT, "exact", "z-index"],
  "item.paddingY": [ITEM, "px", "padding-top"],
  "item.paddingX": [ITEM, "px", "padding-left"],
  // 아이콘 ↔ 이름 8 — 아이콘 · 글을 담은 콘텐츠 층의 가로 간격
  "item.gap": ["[data-slot=menu-item-content]", "px", "column-gap"],
  "item.height": [ITEM, "px", "height"],
  "item.cursor": [ITEM, "exact", "cursor"],
  "itemIcon.size": ["[data-slot=menu-item-icon] > svg", "px", "width"],
  "itemIcon.color": ["[data-slot=menu-item-icon]", "color", "color"],
  "itemLabel.typography": [LABEL, "typography"],
  "itemLabel.fontWeight": [LABEL, "exact", "font-weight"],
  "itemLabel.foreground": [LABEL, "color", "color"],
  "itemDescription.typography": [DESC, "typography"],
  "itemDescription.fontWeight": [DESC, "exact", "font-weight"],
  "itemDescription.foreground": [DESC, "color", "color"],
  // 이름 ↔ 설명 2 — 둘을 담은 글 칸의 세로 간격
  "itemDescription.gap": [
    ":has(> [data-slot=menu-item-label]):has(> [data-slot=menu-item-description])",
    "px",
    "row-gap",
  ],
  "suffixIcon.size": ["[data-slot=menu-item-suffix-icon] > svg", "px", "width"],
  "suffixIcon.color": ["[data-slot=menu-item-suffix-icon]", "color", "color"],
  // 알약 — 쉴 때 줄 폭 전체(0 · 모서리 0), 호버 · 누름에 좌우 8 들어온 모서리 12 로 칠한다
  "highlight.background": [PILL, "color", "background-color"],
  "highlight.insetX": [PILL, "px", "left"],
  "highlight.radius": [PILL, "px", "border-top-left-radius"],
  "groupLabel.typography": [GROUP_LABEL, "typography"],
  "groupLabel.fontWeight": [GROUP_LABEL, "exact", "font-weight"],
  "groupLabel.foreground": [GROUP_LABEL, "color", "color"],
  "groupLabel.paddingY": [GROUP_LABEL, "px", "padding-top"],
  "groupLabel.paddingX": [GROUP_LABEL, "px", "padding-left"],
};
