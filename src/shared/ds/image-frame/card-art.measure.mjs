// Card Art 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다. 값은 src/shared/ds/spec/card-art.json,
// 견본(spec="card-art")은 image-frame.demo.tsx 에 있다 — 카드 그림은 Image Frame 과 한 폴더라 잴 자리도 이 폴더에 둔다
// (검사기는 스펙 이름의 폴더에 없으면 다른 폴더의 <스펙>.measure.mjs 를 찾는다).
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 재지 않는 값(card-art.test.tsx 가 맡는다)
//   face.background · face.foreground  "기관 색" · "기관 글자색" — 기관마다 다른 색이라 스펙에 값이 없다(78곳 모두의 색 · 글자색과 대비는
//     institution-colors.test.tsx 와 card-art.test.tsx 가 표 그대로 칠하는지 본다)
//   issuer.overflowX  "말줄임" — 문장이다(테스트가 truncate · line-clamp 클래스를 본다)
//   initial.fontSize  "면 높이의 40%" — 문장이다(테스트가 max(10px, round(40cqh)) 식을 본다). initial.lineHeight 는 배율이다
// face.paddingX · face.paddingBottom 은 스펙에서 면의 값이지만 글 묶음(card-art-label)이 면 아래에 붙어 그 안쪽 여백을 가진다 — 그 요소로 잰다.
// 글 묶음은 작은 면(96 미만)에서 숨는다(display none) — 계산된 값은 그래도 읽힌다.
const LABEL = "[data-slot=card-art-label]";
const ISSUER = "[data-slot=card-art-issuer]";
const NAME = "[data-slot=card-art-name]";
const INITIAL = "[data-slot=card-art-initial]";

export default {
  "root.aspectRatio": ["root", "exact", "aspect-ratio"],
  "face.paddingX": [LABEL, "px", "padding-left"],
  "face.paddingBottom": [LABEL, "px", "padding-bottom"],
  "issuer.fontWeight": [ISSUER, "exact", "font-weight"],
  "issuer.typography": [ISSUER, "typography", "font-size"],
  "name.fontWeight": [NAME, "exact", "font-weight"],
  "name.typography": [NAME, "typography", "font-size"],
  "name.lineClamp": [NAME, "exact", "-webkit-line-clamp"],
  "initial.fontWeight": [INITIAL, "exact", "font-weight"],
  "initial.textTransform": [INITIAL, "exact", "text-transform"],
};
