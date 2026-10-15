// Logo Tile 을 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 재지 않는 값(logo-tile.test.tsx 가 맡는다)
//   root.background  face institution "기관 색"(표의 color — 기관마다 다르다) · face name "chart-{이름 색}"(이름마다 다르다) — 스펙에 값이 없다.
//     기관 색 표 78곳의 색 · 글자색은 institution-colors.test.tsx 가 표 그대로인지 보고, 이름 → 색 규칙은 logo-tile.test.tsx 가 본다
//   initial.foreground  face institution "기관 글자색"(표의 text) — 같은 이유. face name 은 fg-neutral-inverted 라 잰다
//   initial.lineHeight  1 — 배율이다. 계산된 줄 높이는 px 라(글자 크기와 같다) 이 값과 견줄 수 없다
//   image.objectFit(카드)  "카드 전체" · image.radius "Image Frame 모서리" — 문장이다(카드 그림은 판 안의 Image Frame 이다. 폭 · 모서리 ·
//     90° 돌리기는 테스트가 본다). 그래서 카드 그림은 data-slot 이 logo-tile-card-image 이고, 이 파일의 image.objectFit 은 로고 그림
//     (logo-tile-image — contain)만 잰다
// 윤곽(stroke)은 ::after 의 안쪽 그림자라 그 두께 · 색을 정하는 타일의 변수를 잰다(Avatar 와 같은 방식).
export default {
  "root.size": ["root", "px", "width"],
  "root.radius": ["root", "px", "border-top-left-radius"],
  "root.overflow": ["root", "exact", "overflow"],
  "initial.fontSize": ["[data-slot=logo-tile-initial]", "px", "font-size"],
  "initial.fontWeight": [
    "[data-slot=logo-tile-initial]",
    "exact",
    "font-weight",
  ],
  "initial.textTransform": [
    "[data-slot=logo-tile-initial]",
    "exact",
    "text-transform",
  ],
  "initial.foreground": ["[data-slot=logo-tile-initial]", "color", "color"],
  "plate.padding": ["[data-slot=logo-tile-plate]", "px", "padding-left"],
  "plate.background": [
    "[data-slot=logo-tile-plate]",
    "color",
    "background-color",
  ],
  "image.objectFit": ["[data-slot=logo-tile-image]", "exact", "object-fit"],
  "stroke.borderWidth": ["root", "px", "--logo-tile-border-width"],
  "stroke.borderColor": ["root", "color", "--logo-tile-border-color"],
};
