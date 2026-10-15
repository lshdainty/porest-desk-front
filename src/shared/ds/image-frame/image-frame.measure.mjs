// Image Frame 을 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 재지 않는 값(문장 · 시간 · 그림자 · 변환 — image-frame.test.tsx 가 맡는다)
//   root.width · root.height  "부르는 쪽" · "폭 ÷ 비율" — 문장이다(비율은 root.aspectRatio 가 잰다. 폭 · 높이는 테스트가 본다)
//   image.width · image.height  "100%" — 계산된 값은 px 라 글자와 견줄 수 없다(img 는 absolute · inset 0 · size-full 이다)
//   image.loading  img 의 속성이지 CSS 가 아니다 — 테스트가 lazy 기본 · eager 를 본다
//   image.rotate  "90deg" — 계산된 값이 변환 행렬이다. 테스트가 세로 카드 그림이 돌아가는지(data-rotated · 클래스)를 본다
//   image.display  "none" — 실패하면 img 를 걷는다(요소가 없다). 테스트가 img 가 없는지를 본다
//   floater.offset  위 시작 자리의 위(top)로 잰다. 나머지 세 자리는 같은 6 이다(테스트가 네 자리 클래스를 본다)
//   indicator.radius  9999(rounded-full) — 계산값이 매우 큰 수라 9999 와 같게 비교되지 않는다. 테스트가 알약 클래스를 본다
//   skeleton.shimmer · fallback.glyphSize  그라디언트 · "틀 높이의 50%" — 문장이다(글자 크기는 Content Placeholder 의 검사가 잰다)
//   motion  150ms · 곡선 — 시간이다. 테스트가 처음부터 받아 둔 그림 · 방금 받은 그림의 클래스를 본다
// 윤곽(stroke)은 ::after 의 안쪽 그림자라 그 두께 · 색을 정하는 틀의 변수를 잰다(Avatar 와 같은 방식).
export default {
  "root.radius": ["root", "px", "border-top-left-radius"],
  "root.overflow": ["root", "exact", "overflow"],
  "root.aspectRatio": ["root", "exact", "aspect-ratio"],
  "image.objectFit": ["[data-slot=image-frame-image]", "exact", "object-fit"],
  // 받는 동안 그림은 보이지 않게 — 받는 중 견본(hold)의 img
  "image.opacity": ["[data-slot=image-frame-image]", "exact", "opacity"],
  // contain 의 흰 판 — 그림 상자 자체의 바탕(object-fit 의 빈 자리가 그 바탕이다)
  "plate.background": [
    "[data-slot=image-frame-image]",
    "color",
    "background-color",
  ],
  "stroke.borderWidth": ["root", "px", "--image-frame-border-width"],
  "stroke.borderColor": ["root", "color", "--image-frame-border-color"],
  "floater.offset": [
    "[data-slot=image-frame-floater][data-placement=top-start]",
    "px",
    "top",
  ],
  "indicator.background": [
    "[data-slot=image-frame-indicator]",
    "color",
    "background-color",
  ],
  "indicator.foreground": [
    "[data-slot=image-frame-indicator]",
    "color",
    "color",
  ],
  "indicator.typography": [
    "[data-slot=image-frame-indicator]",
    "typography",
    "font-size",
  ],
  "indicator.fontWeight": [
    "[data-slot=image-frame-indicator]",
    "exact",
    "font-weight",
  ],
  "indicator.paddingX": [
    "[data-slot=image-frame-indicator]",
    "px",
    "padding-left",
  ],
  "indicator.paddingY": [
    "[data-slot=image-frame-indicator]",
    "px",
    "padding-top",
  ],
  "indicator.minHeight": [
    "[data-slot=image-frame-indicator]",
    "px",
    "min-height",
  ],
  // 받는 중 · 없음 — 스켈레톤의 면 · 대체 그림의 면과 그림 색(Skeleton · Content Placeholder 를 그대로 쓴다)
  "skeleton.background": ["[data-slot=skeleton]", "color", "background-color"],
  "fallback.background": [
    "[data-slot=content-placeholder]",
    "color",
    "background-color",
  ],
  "fallback.glyphColor": [
    "[data-slot=content-placeholder-glyph]",
    "color",
    "color",
  ],
};
