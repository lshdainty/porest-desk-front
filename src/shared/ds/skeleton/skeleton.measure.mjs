// Skeleton 을 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 견본은 면(Skeleton) 하나다. 적지 않은 값 —
//   shimmer.background  띠의 그라디언트 — 재는 법(색 하나 · 숫자 · 글 그대로)으로는 맞출 수 없다
//   region · slowText   기다린 시간(1초 · 5초)이 지나야 그려진다 — 시간표 · 글 · 여백은 skeleton.test.tsx 가 본다
export default {
  "root.background": ["root", "color", "background-color"],
  "root.radius": ["root", "px", "border-top-left-radius"],
  // 모션 줄이기(reducedMotion)의 값 — 검사기가 모션 줄이기를 흉내 내지 않아 아직 그 상태의 견본은 없다
  "shimmer.opacity": ["[data-slot=skeleton-shimmer]", "px", "opacity"],
};
