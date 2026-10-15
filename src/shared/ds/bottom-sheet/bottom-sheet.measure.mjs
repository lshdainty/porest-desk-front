// Bottom Sheet 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 견본의 첫 요소(root)는 무대다(overlay-stage.tsx) — 시트는 무대 안에 열린 모달이라 모두 선택자로 잰다. 누름 견본은
// 첫 요소가 닫기 버튼 위의 작은 상자라 검사기가 닫기 버튼을 올리고 누른다.
// 본문 여백은 "바닥이 없을 때만 16" · "끝 흐림이면 80" 처럼 조건이 있다 — 선택자(:last-child · 흐림 속성)가 그 조건이라
// 맞지 않는 견본에서는 요소를 못 찾아 재지 않는다.
// 재지 않는 것 —
//   root.maxHeight · root.paddingBottom   "화면 높이의 90%" · "안전 영역" 은 문장이다(bottom-sheet.test.tsx 가 클래스를 본다)
//   closeButton.touchTarget · handle.touchTarget   누르는 영역 44 는 ::before 라 검사기가 읽지 못한다
//   closeButton.transition*              속성마다 시간이 달라(색 150ms · 축소 100ms) 한 값으로 비교되지 않는다
//   closeButton.scale · fog.mask · fog.size · body.scrollPadding   문장 · 그라디언트라 재는 법(색 하나 · 숫자)으로 맞출 수 없다
//   footer.buttonSize     "large 48" 은 문장이다 — 바닥 버튼의 높이로 본다(아래 button.height 가 아니라 bottom-sheet.test.tsx)
//   radius full(closeButton.radius · handle.radius 9999)  rounded-full 은 계산값이 매우 큰 수라 9999 와 같게 비교되지 않는다 — 테스트가 클래스를 본다
export default {
  "overlay.background": [
    "[data-slot=bottom-sheet-overlay]",
    "color",
    "background-color",
  ],
  "overlay.zIndex": ["[data-slot=bottom-sheet-overlay]", "exact", "z-index"],
  "root.maxWidth": ["[data-slot=bottom-sheet-content]", "px", "max-width"],
  "root.radius": [
    "[data-slot=bottom-sheet-content]",
    "px",
    "border-top-left-radius",
  ],
  "root.background": [
    "[data-slot=bottom-sheet-content]",
    "color",
    "background-color",
  ],
  "root.shadow": ["[data-slot=bottom-sheet-content]", "exact", "box-shadow"],
  "root.zIndex": ["[data-slot=bottom-sheet-content]", "exact", "z-index"],
  "closeButton.size": ["[data-slot=bottom-sheet-close]", "px", "width"],
  "closeButton.background": [
    "[data-slot=bottom-sheet-close]",
    "color",
    "background-color",
  ],
  "closeButton.iconSize": [
    "[data-slot=bottom-sheet-close] > svg",
    "px",
    "width",
  ],
  "closeButton.color": ["[data-slot=bottom-sheet-close]", "color", "color"],
  "closeButton.top": ["[data-slot=bottom-sheet-close]", "px", "top"],
  "closeButton.right": ["[data-slot=bottom-sheet-close]", "px", "right"],
  "header.paddingTop": ["[data-slot=bottom-sheet-header]", "px", "padding-top"],
  "header.paddingBottom": [
    "[data-slot=bottom-sheet-header]",
    "px",
    "padding-bottom",
  ],
  "header.paddingX": ["[data-slot=bottom-sheet-header]", "px", "padding-left"],
  "header.gap": ["[data-slot=bottom-sheet-header]", "px", "row-gap"],
  "title.typography": ["[data-slot=bottom-sheet-title]", "typography"],
  "title.fontWeight": [
    "[data-slot=bottom-sheet-title]",
    "exact",
    "font-weight",
  ],
  "title.foreground": ["[data-slot=bottom-sheet-title]", "color", "color"],
  "description.typography": [
    "[data-slot=bottom-sheet-description]",
    "typography",
  ],
  "description.fontWeight": [
    "[data-slot=bottom-sheet-description]",
    "exact",
    "font-weight",
  ],
  "description.foreground": [
    "[data-slot=bottom-sheet-description]",
    "color",
    "color",
  ],
  // 목록을 바로 두는 본문은 좌우 여백을 뺀다(px-0 — bottom-sheet.md 코드) — 그 견본은 재지 않는다
  "body.paddingX": [
    "[data-slot=bottom-sheet-body]:not(.px-0)",
    "px",
    "padding-left",
  ],
  // 바닥이 없는 본문(맨 끝)이거나 끝 흐림이 걸린 본문 — 16 · 80
  "body.paddingBottom": [
    "[data-slot=bottom-sheet-body]:is(:last-child, [data-scroll-fog])",
    "px",
    "padding-bottom",
  ],
  "body.paddingTop": [
    "[data-slot=bottom-sheet-body][data-scroll-fog]",
    "px",
    "padding-top",
  ],
  "footer.paddingTop": ["[data-slot=bottom-sheet-footer]", "px", "padding-top"],
  "footer.paddingX": ["[data-slot=bottom-sheet-footer]", "px", "padding-left"],
  "footer.paddingBottom": [
    "[data-slot=bottom-sheet-footer]",
    "px",
    "padding-bottom",
  ],
  "footer.gap": ["[data-slot=bottom-sheet-footer]", "px", "column-gap"],
  "handle.width": ["[data-slot=bottom-sheet-handle]", "px", "width"],
  "handle.height": ["[data-slot=bottom-sheet-handle]", "px", "height"],
  "handle.background": [
    "[data-slot=bottom-sheet-handle]",
    "color",
    "background-color",
  ],
  "handle.top": ["[data-slot=bottom-sheet-handle]", "px", "top"],
  "focusRing.width": ["[data-slot=bottom-sheet-close]", "px", "outline-width"],
  "focusRing.offset": [
    "[data-slot=bottom-sheet-close]",
    "px",
    "outline-offset",
  ],
  "focusRing.color": [
    "[data-slot=bottom-sheet-close]",
    "color",
    "outline-color",
  ],
};
