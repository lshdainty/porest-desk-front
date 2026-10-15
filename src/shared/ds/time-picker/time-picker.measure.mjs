// Time Picker 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 휠의 크기 · 색 · 띠 · 안개는 Wheel Picker(wheel-picker.measure.mjs · medium 5칸)가 잰다 — 여기서는 Time Picker 가 정하는 값만 잰다.
// 재지 않는 것(문장이라 검사기가 맞출 수 없다 — time-picker.test.tsx 가 맡는다)
//   root.columnOrder   오전·오후 → 시 → 분 — 테스트가 칼럼 순서 · 이름을 본다
//   root.valueFormat   24시간 {hour, minute} — 테스트가 onValueChange 의 값을 본다
//   periodColumn.align · hourColumn.align · minuteColumn.align / .items — 정렬은 flex 의 justify-content 라 스펙 글("right")과 계산값("flex-end")이 다르다.
//                      항목 정렬 · 항목 수 · 반복 여부는 테스트가 읽는다
export default {
  // 44 × 5 — Wheel Picker medium
  "root.height": ["root", "px", "height"],
};
