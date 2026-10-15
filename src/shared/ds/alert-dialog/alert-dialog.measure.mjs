// Alert Dialog 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 견본의 첫 요소(root)는 무대다(overlay-stage.tsx) — 확인창은 무대 안에 열린 모달이라 모두 선택자로 잰다.
// 재지 않는 것 —
//   root.marginX · root.maxWidth 의 "화면 − 64"   좌우 32 는 너비 calc(100% − 64) 로 나오는 값이라 CSS 속성이 아니다(무대 336 = 272 + 64 로 맞춘다)
//   footer.buttonSize     "medium 40 · 1280 이상 small 36" 은 문장이다. 견본은 1440 이라 small 36 이 서는지는 Button 의 높이로 본다
//                         (alert-dialog.test.tsx 가 1280 을 오가며 크기를 본다)
//   footer.direction      가로 · 세로는 flex-direction 이 아니라 줄바꿈(wrap-reverse)이 정한다 — 한쪽 글이 반 폭을 넘으면 저절로 넘어간다.
//                         견본(vertical)은 확정 버튼이 취소 위에 서는지를 눈으로 본다
//   motion                시간 · 곡선 · 크기 변화는 CSS 값이 아니라 애니메이션이다
export default {
  "overlay.background": [
    "[data-slot=alert-dialog-overlay]",
    "color",
    "background-color",
  ],
  "overlay.zIndex": ["[data-slot=alert-dialog-overlay]", "exact", "z-index"],
  "root.maxWidth": ["[data-slot=alert-dialog-content]", "px", "max-width"],
  "root.padding": ["[data-slot=alert-dialog-content]", "px", "padding-top"],
  "root.radius": [
    "[data-slot=alert-dialog-content]",
    "px",
    "border-top-left-radius",
  ],
  "root.background": [
    "[data-slot=alert-dialog-content]",
    "color",
    "background-color",
  ],
  "root.shadow": ["[data-slot=alert-dialog-content]", "exact", "box-shadow"],
  "root.zIndex": ["[data-slot=alert-dialog-content]", "exact", "z-index"],
  "title.typography": ["[data-slot=alert-dialog-title]", "typography"],
  "title.fontWeight": [
    "[data-slot=alert-dialog-title]",
    "exact",
    "font-weight",
  ],
  "title.foreground": ["[data-slot=alert-dialog-title]", "color", "color"],
  "description.typography": [
    "[data-slot=alert-dialog-description]",
    "typography",
  ],
  "description.fontWeight": [
    "[data-slot=alert-dialog-description]",
    "exact",
    "font-weight",
  ],
  "description.foreground": [
    "[data-slot=alert-dialog-description]",
    "color",
    "color",
  ],
  "description.marginTop": [
    "[data-slot=alert-dialog-description]",
    "px",
    "margin-top",
  ],
  "footer.paddingTop": ["[data-slot=alert-dialog-footer]", "px", "padding-top"],
  "footer.gap": ["[data-slot=alert-dialog-footer]", "px", "column-gap"],
  // 키보드 초점 — 확정 버튼(Button 의 링). 확인창 자체는 링이 없다
  "focusRing.width": ["[data-slot=alert-dialog-action]", "px", "outline-width"],
  "focusRing.offset": [
    "[data-slot=alert-dialog-action]",
    "px",
    "outline-offset",
  ],
  "focusRing.color": [
    "[data-slot=alert-dialog-action]",
    "color",
    "outline-color",
  ],
};
