// Slider 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
// 견본은 틀(div) 안의 Slider 또는 RangeSlider 다(틀이 키보드 포커스를 손잡이로 넘긴다) — 부위는 data-slot 으로 찾는다.
// 손잡이는 첫 [role=slider] — 견본은 값을 가운데에 두어 올리고 누르는 자리(견본 가운데)에 첫 손잡이가 있다.
// 머리 값(SliderValue)은 따로 놓은 견본이다 — 슬라이더 부위가 없어 슬라이더 키는 그 견본에서 재지 않는다.
// 재지 않는 값(slider.test.tsx 가 맡는다):
//   root.width · root.commit · control.touchTarget · touchAction · dragStart  문장 · 동작 값(놓인 자리 폭 · 손을 뗄 때 한 번 · 150ms · 3px)
//   control.cursor  끄는 동안 손잡이 줄(포인터를 잡은 요소)이 grabbing 이라 스펙의 pointer 와 상태마다 다르다 — 손잡이의 cursor 가 상태를 말한다
//   tick.*          틈은 마스크로 트랙을 끊어 놓인 표면이 비친다 — 색 · 폭이 요소에 없다
//   valueIndicator.display · clamp · enter* · exit*  보임 · 숨김 · 안으로 밀림 · 전환은 문장 · 시간 값
//   thumb.borderWidth · shadow · inset · pageStep · keyboard · snap · name · fill.span · markers.content/align  동작 · 문장 값
export default {
  "root.gap": ["[data-slot=slider]", "px", "row-gap"],
  "root.paddingTop": ["[data-slot=slider]", "px", "padding-top"],
  "control.height": ["[data-slot=slider-control]", "px", "height"],
  "track.height": ["[data-slot=slider-track]", "px", "height"],
  "track.radius": ["[data-slot=slider-track]", "px", "border-top-left-radius"],
  "track.background": ["[data-slot=slider-track]", "color", "background-color"],
  "fill.background": ["[data-slot=slider-fill]", "color", "background-color"],
  "thumb.size": ["[role=slider]", "px", "width"],
  "thumb.radius": ["[role=slider]", "px", "border-top-left-radius"],
  "thumb.background": ["[role=slider]", "color", "background-color"],
  "thumb.cursor": ["[role=slider]", "exact", "cursor"],
  "valueIndicator.background": [
    "[data-slot=slider-value-indicator-box]",
    "color",
    "background-color",
  ],
  "valueIndicator.foreground": [
    "[data-slot=slider-value-indicator-box]",
    "color",
    "color",
  ],
  "valueIndicator.typography": [
    "[data-slot=slider-value-indicator-box]",
    "typography",
  ],
  "valueIndicator.fontWeight": [
    "[data-slot=slider-value-indicator-box]",
    "exact",
    "font-weight",
  ],
  "valueIndicator.paddingY": [
    "[data-slot=slider-value-indicator-box]",
    "px",
    "padding-top",
  ],
  "valueIndicator.paddingX": [
    "[data-slot=slider-value-indicator-box]",
    "px",
    "padding-left",
  ],
  "valueIndicator.radius": [
    "[data-slot=slider-value-indicator-box]",
    "px",
    "border-top-left-radius",
  ],
  "valueIndicator.minWidth": [
    "[data-slot=slider-value-indicator-box]",
    "px",
    "min-width",
  ],
  "valueIndicator.arrowWidth": [
    "[data-slot=slider-value-indicator-arrow]",
    "px",
    "width",
  ],
  "valueIndicator.arrowHeight": [
    "[data-slot=slider-value-indicator-arrow]",
    "px",
    "height",
  ],
  "markers.typography": ["[data-slot=slider-markers]", "typography"],
  "markers.foreground": ["[data-slot=slider-markers]", "color", "color"],
  "headerValue.typography": ["[data-slot=slider-value]", "typography"],
  "headerValue.fontWeight": [
    "[data-slot=slider-value]",
    "exact",
    "font-weight",
  ],
  "headerValue.foreground": ["[data-slot=slider-value]", "color", "color"],
  "focusRing.width": ["[role=slider]", "px", "outline-width"],
  "focusRing.offset": ["[role=slider]", "px", "outline-offset"],
  "focusRing.color": ["[role=slider]", "color", "outline-color"],
};
