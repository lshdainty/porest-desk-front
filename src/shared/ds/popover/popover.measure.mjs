// Popover 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 견본의 첫 요소는 표면이 아니라 표면을 띄운 자리다(popover.demo.tsx 의 OpenPopover) — Radix 는 표면을 감싼
// div(position: fixed) 안에 두므로 표면이 견본의 첫 요소가 될 수 없다. 그래서 모두 선택자로 잰다.
//
// 재지 않는 것(문장 · 계산 · 그림자라 popover.test.tsx 가 맡는다)
//   - root.shadow — 계산된 box-shadow 는 색이 앞에 오는 다른 글이라 스펙 글과 같은지 글로 비교할 수 없다. 모서리 · 바탕은 잰다.
//   - root.offset(8) · 화면 가장자리 16 — Radix 의 자리 계산(sideOffset · collisionPadding)이라 CSS 로 보이지 않는다(POPOVER_POSITION 을 테스트가 맞춘다).
//   - closeButton.top(27) · right(24) — 아이콘이 상자(52)보다 15 안쪽이라 상자의 top · right 는 12 · 9 다. 아이콘 자리(상자 − 15)는 테스트가 맞춘다.
//   - closeButton.touchTarget · transition* · footer.buttonSize(small 36) — 문장 · 전환 글. 버튼 크기는 Button 이 정한다(Button 의 검사).
//   - pressed(닫기 버튼 누름 색 · 2px 축소) — 검사기가 견본의 첫 요소(표면을 띄운 빈 자리)를 눌러 닫기 버튼을 누를 수 없다.
//     누름 색 · 축소는 클래스(POPOVER_CLOSE)를 테스트가 맞춘다.
//   - root.maxHeight — Radix 가 트리거 아래 남은 공간(--radix-popover-content-available-height)과 작은 쪽을 고르므로 견본 자리에 따라 값이 바뀐다.
//     600 상한은 테스트가 맞춘다.
const POP = "[data-slot=popover-content]";
const CLOSE = "[data-slot=popover-close]";
const HEADER = "[data-slot=popover-header]";
const TITLE = "[data-slot=popover-title]";
const DESC = "[data-slot=popover-description]";
const BODY = "[data-slot=popover-body]";
const FOOTER = "[data-slot=popover-footer]";

export default {
  "root.minWidth": [POP, "px", "min-width"],
  "root.maxWidth": [POP, "px", "max-width"],
  "root.radius": [POP, "px", "border-top-left-radius"],
  "root.background": [POP, "color", "background-color"],
  "root.zIndex": [POP, "exact", "z-index"],
  "header.paddingTop": [HEADER, "px", "padding-top"],
  "header.paddingX": [HEADER, "px", "padding-left"],
  "header.paddingBottom": [HEADER, "px", "padding-bottom"],
  "header.gap": [`${HEADER}:has(${DESC})`, "px", "row-gap"],
  "title.typography": [TITLE, "typography"],
  "title.fontWeight": [TITLE, "exact", "font-weight"],
  "title.foreground": [TITLE, "color", "color"],
  "description.typography": [DESC, "typography"],
  "description.fontWeight": [DESC, "exact", "font-weight"],
  "description.foreground": [DESC, "color", "color"],
  "closeButton.size": [CLOSE, "px", "width"],
  "closeButton.radius": [CLOSE, "px", "border-top-left-radius"],
  "closeButton.iconSize": [`${CLOSE} > svg`, "px", "width"],
  "closeButton.color": [CLOSE, "color", "color"],
  "body.paddingX": [BODY, "px", "padding-left"],
  // 위 여백은 머리가 없을 때만, 아래 여백은 바닥이 없을 때만 — 그 견본에서만 잰다
  "body.paddingTop": [`${BODY}:first-child`, "px", "padding-top"],
  "body.paddingBottom": [`${BODY}:last-child`, "px", "padding-bottom"],
  "body.overflowY": [BODY, "exact", "overflow-y"],
  "footer.paddingTop": [FOOTER, "px", "padding-top"],
  "footer.paddingX": [FOOTER, "px", "padding-left"],
  "footer.paddingBottom": [FOOTER, "px", "padding-bottom"],
  "footer.gap": [`${FOOTER}:has(> :nth-child(2))`, "px", "column-gap"],
  "footer.justifyContent": [FOOTER, "exact", "justify-content"],
  // 키보드 초점 — 닫기 버튼(밖 2px 링, 브랜드)
  "focusRing.width": [CLOSE, "px", "outline-width"],
  "focusRing.offset": [CLOSE, "px", "outline-offset"],
  "focusRing.color": [CLOSE, "color", "outline-color"],
};
