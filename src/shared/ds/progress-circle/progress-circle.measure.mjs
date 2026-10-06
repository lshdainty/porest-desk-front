// Progress Circle 을 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
export default {
  "root.size": ["root", "px", "width"],
  "root.thickness": ["[data-slot=progress-circle-track]", "px", "stroke-width"],
  "root.track": ["[data-slot=progress-circle-track]", "color", "stroke"],
  "root.range": ["[data-slot=progress-circle-range]", "color", "stroke"],
  "range.linecap": [
    "[data-slot=progress-circle-range]",
    "exact",
    "stroke-linecap",
  ],
};
