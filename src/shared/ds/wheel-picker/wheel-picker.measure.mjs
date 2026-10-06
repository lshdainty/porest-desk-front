// Wheel Picker 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 재지 않는 것 — root.height(항목 높이 × 보이는 수) · column.width(항목 글 폭 + 좌우 16) · fog.height(min(휠 높이 × 40%,
// 항목 3칸))는 스펙이 식(문장)이라 검사기가 맞출 수 없다.
// 키보드 초점은 칼럼에 선다 — 검사기는 견본의 첫 요소(휠)에 초점을 주므로 견본이 그것을 첫 칼럼으로 넘긴다(wheel-picker.demo.tsx).
const ITEM = "[data-slot=wheel-picker-item]";
const SELECTED = `${ITEM}[data-selected]`;
const LABEL = "[data-slot=wheel-picker-item-label]";
const INDICATOR = "[data-slot=wheel-picker-indicator]";

export default {
  "root.background": ["root", "color", "background-color"],
  "item.height": [ITEM, "px", "height"],
  "item.paddingX": [LABEL, "px", "padding-left"],
  "item.typography": [LABEL, "typography"],
  "item.fontWeight": [LABEL, "exact", "font-weight"],
  "item.numerals": [LABEL, "exact", "font-variant-numeric"],
  // 띠 밖 글자 — 띠에 걸치지 않은 항목
  "item.foreground": [`${ITEM}:not([data-overlap])`, "color", "color"],
  // 띠 위 글자 — 띠에 걸친 항목은 글자를 투명하게 하고 이 색이 든 그라데이션을 글자로 자른다(background-clip: text).
  // 칠한 색은 CSS 로 읽을 수 없어 그 색 변수를 잰다(막히면 fg-disabled 로 바뀐다)
  "item.selectedForeground": [SELECTED, "color", "--wheel-selected-color"],
  "indicator.insetX": [INDICATOR, "px", "left"],
  "indicator.radius": [INDICATOR, "px", "border-top-left-radius"],
  "indicator.background": [INDICATOR, "color", "background-color"],
  "indicator.height": [INDICATOR, "px", "height"],
  // 키보드 링 — 키로 들어온 칼럼의 고른 항목 둘레 안쪽
  "focusRing.width": [SELECTED, "px", "outline-width"],
  "focusRing.offset": [SELECTED, "px", "outline-offset"],
  "focusRing.color": [SELECTED, "color", "outline-color"],
};
