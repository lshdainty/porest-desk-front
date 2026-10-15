// Menu Sheet 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 견본의 첫 요소(root)는 무대다(overlay-stage.tsx) — 시트는 무대 안에 열린 모달이라 모두 선택자로 잰다. 호버 · 누름 견본은
// 첫 요소가 첫 줄 위의 작은 상자라 검사기가 그 줄을 올리고 누른다. 견본은 조합의 톤에 맞는 줄만 담는다 — 첫 줄이 곧 재는 줄이다.
//
// 재지 않는 것(문장 · 계산 · 모션이라 menu-sheet.test.tsx 가 맡는다)
//   - root.maxHeight   "화면 높이의 90%" 는 문장이다(Bottom Sheet 가 이미 정한다)
//   - handle.radius(9999)   rounded-full 은 계산값이 매우 큰 수라 9999 와 같게 비교되지 않는다
//   - item.transition*   속성이 background-color 하나라도 계산값은 "0.15s" 라 스펙 글("150ms")과 글로 비교되지 않는다
//   - divider.color · divider.height   줄 사이 선은 안쪽 아래 inset box-shadow(1px) — 계산된 box-shadow 는 색이 앞에 오는 글이다
//   - pressed item.scale · scaleDuration · scaleEasing   "콘텐츠 2px 거리 축소" 는 문장이다(기준 길이를 누르는 순간 잰다)
//   - closeButton.hovered · pressed 바탕   닫기는 키보드 초점이 올 때만 보인다 — 초점 견본이 평소 값을 재고, 올림 · 누름 색은 클래스를 테스트가 맞춘다
//   - 열림 · 닫힘 모션(300ms · 200ms)   Bottom Sheet 그대로 — 시간은 문장이다
// 닫기 버튼 · 줄의 초점 링은 :focus-visible 로 가른다 — 한 키(focusRing.offset)가 줄(-2)과 닫기(2 = closeButtonOffset)에 따로 걸린다.
const SHEET = "[data-slot=menu-sheet-content]";
const ITEM = "[data-slot=menu-sheet-item]";
const CONTENT = "[data-slot=menu-sheet-item-content]";
const ICON = "[data-slot=menu-sheet-item-icon]";
const LABEL = "[data-slot=menu-sheet-item-label]";
const DESC = "[data-slot=menu-sheet-item-description]";
const CLOSE = "[data-slot=menu-sheet-close]:focus-visible";

export default {
  "overlay.background": [
    "[data-slot=bottom-sheet-overlay]",
    "color",
    "background-color",
  ],
  "overlay.zIndex": ["[data-slot=bottom-sheet-overlay]", "exact", "z-index"],
  "root.maxWidth": [SHEET, "px", "max-width"],
  "root.radius": [SHEET, "px", "border-top-left-radius"],
  "root.background": [SHEET, "color", "background-color"],
  "root.shadow": [SHEET, "exact", "box-shadow"],
  "root.paddingTop": [SHEET, "px", "padding-top"],
  "root.paddingX": [SHEET, "px", "padding-left"],
  "root.paddingBottom": [SHEET, "px", "padding-bottom"],
  "root.zIndex": [SHEET, "exact", "z-index"],
  "handle.width": ["[data-slot=bottom-sheet-handle]", "px", "width"],
  "handle.height": ["[data-slot=bottom-sheet-handle]", "px", "height"],
  "handle.background": [
    "[data-slot=bottom-sheet-handle]",
    "color",
    "background-color",
  ],
  "handle.top": ["[data-slot=bottom-sheet-handle]", "px", "top"],
  "header.paddingBottom": [
    "[data-slot=menu-sheet-header]",
    "px",
    "padding-bottom",
  ],
  "header.gap": [
    "[data-slot=menu-sheet-header]:has([data-slot=menu-sheet-description])",
    "px",
    "row-gap",
  ],
  "header.textAlign": ["[data-slot=menu-sheet-header]", "exact", "text-align"],
  "title.typography": ["[data-slot=menu-sheet-title]", "typography"],
  "title.fontWeight": ["[data-slot=menu-sheet-title]", "exact", "font-weight"],
  "title.foreground": ["[data-slot=menu-sheet-title]", "color", "color"],
  "description.typography": [
    "[data-slot=menu-sheet-description]",
    "typography",
  ],
  "description.fontWeight": [
    "[data-slot=menu-sheet-description]",
    "exact",
    "font-weight",
  ],
  "description.foreground": [
    "[data-slot=menu-sheet-description]",
    "color",
    "color",
  ],
  "group.background": [
    "[data-slot=menu-sheet-group]",
    "color",
    "background-color",
  ],
  "group.radius": [
    "[data-slot=menu-sheet-group]",
    "px",
    "border-top-left-radius",
  ],
  // 묶음 사이 10 — 묶음을 담은 목록의 줄 간격
  "group.gap": ["[data-slot=menu-sheet-list]", "px", "row-gap"],
  "item.minHeight": [ITEM, "px", "min-height"],
  "item.paddingY": [ITEM, "px", "padding-top"],
  "item.paddingX": [ITEM, "px", "padding-left"],
  // 아이콘 ↔ 이름 14 — 아이콘 · 글을 담은 콘텐츠 층의 가로 간격
  "item.gap": [CONTENT, "px", "column-gap"],
  "item.cursor": [ITEM, "exact", "cursor"],
  "item.background": [ITEM, "color", "background-color"],
  "item.justifyContent": [CONTENT, "exact", "justify-content"],
  "itemIcon.size": [`${ICON} > svg`, "px", "width"],
  "itemIcon.color": [ICON, "color", "color"],
  "itemLabel.typography": [LABEL, "typography"],
  "itemLabel.fontWeight": [LABEL, "exact", "font-weight"],
  "itemLabel.foreground": [LABEL, "color", "color"],
  "itemLabel.textAlign": [LABEL, "exact", "text-align"],
  "itemDescription.typography": [DESC, "typography"],
  "itemDescription.fontWeight": [DESC, "exact", "font-weight"],
  "itemDescription.foreground": [DESC, "color", "color"],
  // 이름 ↔ 설명 2 — 둘을 담은 글 칸의 세로 간격
  "itemDescription.gap": [
    ":has(> [data-slot=menu-sheet-item-label]):has(> [data-slot=menu-sheet-item-description])",
    "px",
    "row-gap",
  ],
  // 보조 기술용 닫기 — 키보드 초점이 와서 보일 때의 모양
  "closeButton.minHeight": [CLOSE, "px", "min-height"],
  "closeButton.paddingX": [CLOSE, "px", "padding-left"],
  "closeButton.radius": [CLOSE, "px", "border-top-left-radius"],
  "closeButton.background": [CLOSE, "color", "background-color"],
  "closeButton.typography": [CLOSE, "typography"],
  "closeButton.fontWeight": [CLOSE, "exact", "font-weight"],
  "closeButton.foreground": [CLOSE, "color", "color"],
  "closeButton.marginTop": [CLOSE, "px", "margin-top"],
  // 키보드 초점 링
  "focusRing.width": [`${ITEM}:focus-visible, ${CLOSE}`, "px", "outline-width"],
  "focusRing.offset": [`${ITEM}:focus-visible`, "px", "outline-offset"],
  "focusRing.closeButtonOffset": [CLOSE, "px", "outline-offset"],
  "focusRing.color": [
    `${ITEM}:focus-visible, ${CLOSE}`,
    "color",
    "outline-color",
  ],
};
