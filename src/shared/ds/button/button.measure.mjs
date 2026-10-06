// Button 을 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
export default {
  "root.height": ["root", "px", "height"],
  "root.width": ["root", "px", "width"],
  "root.radius": ["root", "px", "border-top-left-radius"],
  "root.background": ["root", "color", "background-color"],
  // 로딩에서는 label.color(투명)가 같은 CSS color 를 덮는다 — 그때는 그것을 잰다
  "root.foreground": ["root", "color", "color", { skipIf: "label.color" }],
  "root.borderColor": ["root", "color", "border-top-color"],
  "root.borderWidth": ["root", "px", "border-top-width"],
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
