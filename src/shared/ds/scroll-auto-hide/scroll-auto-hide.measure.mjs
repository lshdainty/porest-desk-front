// Scroll Auto Hide 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다. 값은 src/shared/ds/spec/scroll-auto-hide.json.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 견본의 뿌리가 스크롤 상자(scrollContainer)고 숨는 영역(root)은 그 안 맨 위다. 상태는 숨은 정도라 검사기가 올리거나 누르지 않고,
// 견본이 그린 스크롤 위치(shown 은 맨 위 · hidden 은 머리 높이 넘게 내림)에서 sticky · top · 바탕 · 겹침 값을 잰다.
//
// 재지 않는 값 — scroll-auto-hide.test.tsx 가 본다
//   root.transform  "translate3d(0, 0, 0)" · "translate3d(0, −영역 높이, 0)" 글이다(계산된 값은 matrix) — 위치는 테스트가 스크롤을 흉내 내 본다
//   root.follow · root.snapThreshold · root.focus  동작 규칙이다(1:1 · 50% · 초점이 오면 드러냄 — 문장)
//   root.snapDuration · root.snapEasing  스냅할 때만 걸리는 전환 — 평소 계산된 값에는 없다(테스트가 스냅 전환 문자열을 본다)
//   모션 줄이기(motionSetting reduced)  OS 설정이라 카탈로그가 그릴 수 없다 — 테스트가 matchMedia 를 바꿔 본다
export default {
  "scrollContainer.overflowY": ["root", "exact", "overflow-y"],
  "root.position": ["[data-scroll-auto-hide]", "exact", "position"],
  "root.top": ["[data-scroll-auto-hide]", "px", "top"],
  "root.background": ["[data-scroll-auto-hide]", "color", "background-color"],
  "root.zIndex": ["[data-scroll-auto-hide]", "exact", "z-index"],
};
