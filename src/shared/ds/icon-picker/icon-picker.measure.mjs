// Icon Picker 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
// 견본은 둘이다 — 칸 하나(틀 48 안의 IconPickerCell — 올리고 · 누르고 · 탭해서 상태를 잰다)와, 여는 자리 안 전체(IconPickerPanel — 찾기 칸 ·
// 묶음 머리 · 격자 · 칸). 시트 · 팝오버를 열어 재지 않고 안을 틀 안에 그대로 그린다(트리거는 Input Button 이 잰다).
// 칸 견본의 키보드 포커스는 검사기가 틀에 주면 견본이 칸으로 넘긴다. 고른 칸은 첫 칸이라 첫 칸([data-slot=icon-picker-cell])이 고른 값을 잰다.
// 재지 않는 값(icon-picker.test.tsx 가 맡는다)
//   trigger.component · surface.component · surface.width · search.variant · search.match · scroll.scrollFog  구성 · 폭 · 일치 규칙 — 문장 값
//     (팝오버 폭 408 · 시트 · 끝 흐림은 열린 표면의 값이다 — 열린 표면은 테스트가 본다)
//   grid.role · columns · keyboard  역할 · 열 수(들어가는 만큼 — 폭으로 달라진다) · 키보드 — 문장 값(테스트가 열 수 · 화살표를 본다)
//   grid.searchGap  찾는 동안만의 위 여백 — 찾는 견본이 따로 있어 테스트가 클래스를 본다
//   cell.name · role · touchTarget  이름 · 역할 · 48 × 48 — 문장 값(테스트)
//   cell.borderWidth · borderColor  고른 칸의 안쪽 2px 는 ::after 의 테두리라 요소 값이 아니다(input.measure.mjs 의 안쪽 테두리와 같은 까닭) — 테스트가 클래스를 본다
//   cell.scale · scaleDuration · scaleEasing  누름 축소 — 변환 · 시간 값(테스트)
//   count.display · empty.size  화면 밖 알림 · Result Section 크기 — 문장 값(테스트)
const CELL = "[data-slot=icon-picker-cell]";
const HEADER = "[data-slot=icon-picker-group-header]";
export default {
  "groupHeader.typography": [HEADER, "typography"],
  "groupHeader.fontWeight": [HEADER, "exact", "font-weight"],
  "groupHeader.foreground": [HEADER, "color", "color"],
  "groupHeader.paddingTop": [HEADER, "px", "padding-top"],
  "groupHeader.paddingBottom": [HEADER, "px", "padding-bottom"],
  "grid.columnGapMin": [
    "[data-slot=icon-picker-group] > [role=none]",
    "px",
    "column-gap",
  ],
  "grid.rowGap": [
    "[data-slot=icon-picker-group] > [role=none]",
    "px",
    "row-gap",
  ],
  "cell.size": [CELL, "px", "width"],
  "cell.radius": [CELL, "px", "border-top-left-radius"],
  "cell.background": [CELL, "color", "background-color"],
  "cell.cursor": [CELL, "exact", "cursor"],
  "icon.size": [`${CELL} svg`, "px", "width"],
  "icon.strokeWidth": [`${CELL} svg`, "px", "stroke-width"],
  "icon.color": [`${CELL} svg`, "color", "color"],
  "search.height": [
    "[data-slot=icon-picker-search] [data-slot=text-input]",
    "px",
    "min-height",
  ],
  "surface.paddingX": ["[data-slot=icon-picker-search]", "px", "padding-left"],
  "focusRing.width": [CELL, "px", "outline-width"],
  "focusRing.offset": [CELL, "px", "outline-offset"],
  "focusRing.color": [CELL, "color", "outline-color"],
};
