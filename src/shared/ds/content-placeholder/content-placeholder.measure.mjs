// Content Placeholder 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 견본은 자리(ContentPlaceholder) 하나이고, 담는 틀(크기 · 모서리)은 데모가 견본 밖에 둔다. 적지 않은 값 —
//   root.width · height        "100%" — 계산된 값은 px 라 글 그대로 맞출 수 없다(틀을 채운다)
//   glyph.size                 "틀 높이의 50%" — 말로 된 값
//   glyph.minWidth · maxWidth  16 · 160 은 그림 크기 min(clamp(16px, 50cqh, 160px), 100cqw) 의 끝값이다 — CSS 의
//                              min-width · max-width 가 아니라 끝에 닿은 틀에서만 폭과 같다
//   glyph.strokeWidth          "1.5" — 계산된 값은 "1.5px" 로 적혀 글 그대로 맞출 수 없다
export default {
  "root.radius": ["root", "px", "border-top-left-radius"],
  "root.background": ["root", "color", "background-color"],
  "glyph.color": ["[data-slot=content-placeholder-glyph]", "color", "color"],
};
