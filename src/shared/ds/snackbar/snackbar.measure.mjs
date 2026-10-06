// Snackbar 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
// 견본은 띠(SnackbarView — root)다. 재지 않는 것:
//   region.*            자리는 띠의 부모이고 화면(viewport)에 붙는다 — 견본 안에서 닿지 않는다(snackbar.test.tsx 가 본다)
//   closeButton.size · radius   보조 기술용 닫기는 키보드 초점이 와야 44 · 모서리 8 로 보인다 — 검사기는 띠에 초점을 준다
//   focusRing.actionOffset      액션의 링도 액션에 초점이 와야 그린다
//   글로 된 값          width(100%) · duration · touchTarget · margin · 누름 축소
export default {
  "root.maxWidth": ["root", "px", "max-width"],
  "root.minHeight": ["root", "px", "min-height"],
  "root.padding": ["root", "px", "padding-top"],
  "root.radius": ["root", "px", "border-top-left-radius"],
  "root.background": ["root", "color", "background-color"],
  "root.shadow": ["root", "exact", "box-shadow"],
  "icon.size": ["[data-slot=snackbar-icon]", "px", "width"],
  "icon.paddingRight": ["[data-slot=snackbar-icon]", "px", "padding-right"],
  "icon.color": ["[data-slot=snackbar-icon]", "color", "color"],
  "content.paddingX": ["[data-slot=snackbar-content]", "px", "padding-left"],
  "content.gap": ["[data-slot=snackbar-content]", "px", "column-gap"],
  "message.typography": ["[data-slot=snackbar-message]", "typography"],
  "message.fontWeight": [
    "[data-slot=snackbar-message]",
    "exact",
    "font-weight",
  ],
  "message.foreground": ["[data-slot=snackbar-message]", "color", "color"],
  "action.typography": ["[data-slot=snackbar-action]", "typography"],
  "action.fontWeight": ["[data-slot=snackbar-action]", "exact", "font-weight"],
  "action.foreground": ["[data-slot=snackbar-action]", "color", "color"],
  "action.radius": [
    "[data-slot=snackbar-action]",
    "px",
    "border-top-left-radius",
  ],
  "closeButton.iconSize": ["[data-slot=snackbar-close] > svg", "px", "width"],
  "closeButton.color": ["[data-slot=snackbar-close]", "color", "color"],
  "focusRing.width": ["root", "px", "outline-width"],
  "focusRing.offset": ["root", "px", "outline-offset"],
  "focusRing.color": ["root", "color", "outline-color"],
};
