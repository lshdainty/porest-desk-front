// Scroll Fog 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 견본은 스크롤 상자(ScrollFog) 하나다. 안쪽 여백은 안쪽 감싸개(scroll-fog-content), 스크롤 여유는 스크롤 상자에 있다.
// 적지 않은 값 —
//   fog.mask · fog.size  마스크(그라디언트 셋 · 크기 셋)는 재는 법(색 하나 · 숫자 · 글 그대로)으로 맞출 수 없다
//   fog.placement        말로 된 값
export default {
  "root.overflowY": ["root", "exact", "overflow-y"],
  "root.overflowX": ["root", "exact", "overflow-x"],
  "content.padding": ["[data-slot=scroll-fog-content]", "px", "padding-top"],
  "content.paddingX": ["[data-slot=scroll-fog-content]", "px", "padding-left"],
  "content.paddingTop": ["[data-slot=scroll-fog-content]", "px", "padding-top"],
  "content.paddingBottom": [
    "[data-slot=scroll-fog-content]",
    "px",
    "padding-bottom",
  ],
  // 키 하나에 CSS 속성 하나라 box(세로 — 위 20)만 잰다. row 는 같은 키가 좌우(24)라 건너뛴다.
  // overlayBody · page 는 "위 20px · 아래 80px" 라는 말이라 재지 않는다(padding-top · bottom 과 같은 값)
  "content.scrollPadding": [
    "root",
    "px",
    "scroll-padding-top",
    { skipIf: "content.paddingX" },
  ],
};
