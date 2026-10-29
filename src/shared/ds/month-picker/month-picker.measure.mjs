// Month Picker 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
//
// 달 고르기는 자기 스펙 파일이 없다 — wheel-picker.md "달만 고르기"(연 120 오른쪽 · 월 96 왼쪽 · medium 44 · 5칸 220)를
// 쓰는 자리라서 값은 Wheel Picker 의 스펙(wheel-picker.json)이다. 칸 · 띠 · 안개 · 글자는 wheel-picker.measure.mjs 가
// 연 | 월 휠 견본(medium 5칸)으로 이미 잰다 — `npm run ds:check -- wheel-picker`.
// 여기서 정하는 것(시트 · 팝오버로 열기 · 완료로 넣기 · 닫으면 버리기 · 연 범위)은 문장이라
// month-picker.test.tsx 가 맡는다. 칼럼 폭 120 · 96 은 date-picker-variants 의 같은 상수를 쓴다.
export default {};
