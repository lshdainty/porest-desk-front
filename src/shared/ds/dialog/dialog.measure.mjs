// Dialog 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 견본의 첫 요소(root)는 무대다(overlay-stage.tsx) — 대화상자는 무대 안에 열린 모달이라 모두 선택자로 잰다. 누름 견본은
// 첫 요소가 닫기 버튼 위의 작은 상자라 검사기가 닫기 버튼을 올리고 누른다. 카탈로그는 1440 이라 늘 대화상자다(1280 미만의 시트는 bottom-sheet).
// 본문 여백은 "머리가 없을 때만 위 24 · 바닥이 없을 때만 아래 24 · 끝 흐림이면 20 · 80" 처럼 조건이 있다 — 선택자(:first-child ·
// :last-child · 흐림 속성)가 그 조건이라 맞지 않는 견본에서는 요소를 못 찾아 재지 않는다.
// 재지 않는 것 —
//   root.maxWidth · root.maxHeight   "화면 폭 − 40" · "화면 높이의 80%" 는 문장이다(dialog.test.tsx 가 클래스를 본다)
//   closeButton.top · closeButton.right   아이콘 기준 위 28 · 오른쪽 24 라 투명 상자(52)는 15 씩 당겨 놓는다 — 상자 자리와 값이 다르다(클래스를 테스트가 본다)
//   closeButton.touchTarget · closeButton.transition*   52 상자 자체가 누르는 영역이다 · 속성마다 시간이 달라 한 값으로 비교되지 않는다
//   closeButton.scale · fog.mask · fog.size · body.scrollPadding · footer.buttonSize   문장 · 그라디언트라 재는 법으로 맞출 수 없다
//   divider.height · divider.opacity   머리 아래 선은 안쪽 그림자다 — 색만 --dialog-divider 이름표로 잰다, 나타남은 테스트(data-scrolled)가 본다
//   motion   시간 · 곡선 · 크기 변화는 CSS 값이 아니라 애니메이션이다
const DIALOG = "[data-slot=dialog-content]";
const CLOSE = "[data-slot=dialog-close]";
const BODY = "[data-slot=dialog-body]";

export default {
  "overlay.background": [
    "[data-slot=dialog-overlay]",
    "color",
    "background-color",
  ],
  "overlay.zIndex": ["[data-slot=dialog-overlay]", "exact", "z-index"],
  "root.radius": [DIALOG, "px", "border-top-left-radius"],
  "root.background": [DIALOG, "color", "background-color"],
  "root.shadow": [DIALOG, "exact", "box-shadow"],
  "root.zIndex": [DIALOG, "exact", "z-index"],
  "root.width": [DIALOG, "px", "width"],
  "header.paddingTop": ["[data-slot=dialog-header]", "px", "padding-top"],
  "header.paddingX": ["[data-slot=dialog-header]", "px", "padding-left"],
  "header.paddingBottom": ["[data-slot=dialog-header]", "px", "padding-bottom"],
  "header.gap": ["[data-slot=dialog-header]", "px", "row-gap"],
  "title.typography": ["[data-slot=dialog-title]", "typography"],
  "title.fontWeight": ["[data-slot=dialog-title]", "exact", "font-weight"],
  "title.foreground": ["[data-slot=dialog-title]", "color", "color"],
  "description.typography": ["[data-slot=dialog-description]", "typography"],
  "description.fontWeight": [
    "[data-slot=dialog-description]",
    "exact",
    "font-weight",
  ],
  "description.foreground": [
    "[data-slot=dialog-description]",
    "color",
    "color",
  ],
  "closeButton.size": [CLOSE, "px", "width"],
  "closeButton.radius": [CLOSE, "px", "border-top-left-radius"],
  "closeButton.iconSize": [`${CLOSE} > svg`, "px", "width"],
  "closeButton.color": [CLOSE, "color", "color"],
  "closeButton.background": [CLOSE, "color", "background-color"],
  // 목록을 바로 두는 본문은 좌우 여백을 뺀다(px-0 — dialog.md 코드) — 그 견본은 재지 않는다
  "body.paddingX": [`${BODY}:not(.px-0)`, "px", "padding-left"],
  "body.paddingTop": [
    `${BODY}:is(:first-child, [data-scroll-fog])`,
    "px",
    "padding-top",
  ],
  "body.paddingBottom": [
    `${BODY}:is(:last-child, [data-scroll-fog])`,
    "px",
    "padding-bottom",
  ],
  "body.overflowY": [BODY, "exact", "overflow-y"],
  // 머리 아래 선 색 — 머리에 단 이름표(--dialog-divider)
  "divider.background": [
    "[data-slot=dialog-header]",
    "color",
    "--dialog-divider",
  ],
  "footer.paddingTop": ["[data-slot=dialog-footer]", "px", "padding-top"],
  "footer.paddingX": ["[data-slot=dialog-footer]", "px", "padding-left"],
  "footer.paddingBottom": ["[data-slot=dialog-footer]", "px", "padding-bottom"],
  "footer.gap": ["[data-slot=dialog-footer]", "px", "column-gap"],
  "footer.justifyContent": [
    "[data-slot=dialog-footer]",
    "exact",
    "justify-content",
  ],
  "focusRing.width": [CLOSE, "px", "outline-width"],
  "focusRing.offset": [CLOSE, "px", "outline-offset"],
  "focusRing.color": [CLOSE, "color", "outline-color"],
};
