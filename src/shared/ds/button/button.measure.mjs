// Button 을 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
// 재지 않는 값
//   root.borderColor · borderWidth — outline 변형의 1px 선은 CSS 테두리가 아니라 안쪽 그림자(box-shadow inset, I-29)다.
//     테두리는 상자 높이에 더해져 최소 높이(36 · 40 · 48)를 넘기므로 안쪽에 그린다(Input · Quantity Picker 와 같음).
//     검사기는 요소 계산 스타일의 테두리 값만 읽어 그림자를 못 맞춘다 — button.test.tsx 가 클래스를 본다.
export default {
  "root.height": ["root", "px", "height"],
  "root.width": ["root", "px", "width"],
  "root.radius": ["root", "px", "border-top-left-radius"],
  "root.background": ["root", "color", "background-color"],
  // 로딩에서는 label.color(투명)가 같은 CSS color 를 덮는다 — 그때는 그것을 잰다
  "root.foreground": ["root", "color", "color", { skipIf: "label.color" }],
  "root.paddingX": ["root", "px", "padding-left"],
  "root.paddingY": ["root", "px", "padding-top"],
  "root.padding": ["root", "px", "padding-top"],
  "root.gap": ["root", "px", "column-gap"],
  "label.typography": ["root", "typography"],
  "label.fontWeight": ["root", "exact", "font-weight"],
  "label.color": ["root", "color", "color"],
  "prefixIcon.size": ["svg:not([data-slot])", "px", "width"],
  "suffixIcon.size": ["svg:not([data-slot])", "px", "width"],
  "icon.size": ["svg:not([data-slot])", "px", "width"],
  "progressCircle.size": ["[data-slot=progress-circle]", "px", "width"],
  "progressCircle.thickness": [
    "[data-slot=progress-circle-track]",
    "px",
    "stroke-width",
  ],
  "progressCircle.track": [
    "[data-slot=progress-circle-track]",
    "color",
    "stroke",
  ],
  "progressCircle.range": [
    "[data-slot=progress-circle-range]",
    "color",
    "stroke",
  ],
  "focusRing.width": ["root", "px", "outline-width"],
  "focusRing.offset": ["root", "px", "outline-offset"],
  "focusRing.color": ["root", "color", "outline-color"],
};
