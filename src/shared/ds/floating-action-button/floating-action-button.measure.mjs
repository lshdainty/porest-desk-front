// Floating Action Button 을 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 견본의 뿌리는 버튼 자신이다(스펙의 root). 버튼은 폰 폭 칸(transform 으로 fixed 를 가둔 칸) 안에 있어 right · bottom 이 칸 기준 값이다 —
// 크로미움은 안전 영역이 0 이라 20 이 나온다.
//
// 재지 않는 값(문장 · 합성 · 시간이라 계산값이 스펙의 글과 같지 않은 것) — floating-action-button.test.tsx 가 맡는다
//   root.shadow · position                       그림자 토큰 · "오른쪽 아래(fixed)" 문장 — fixed 는 클래스를 본다
//   root.transitionProperty · Duration · Easing  계산값이 "background-color, scale" · "0.15s" · cubic-bezier(…)
//   pressed.scale · scaleDuration · scaleEasing  2px 거리 축소 — 누름의 scale 은 문장 · 시간
export default {
  "root.size": ["root", "px", "width"],
  "root.radius": ["root", "px", "border-top-left-radius"],
  "root.background": ["root", "color", "background-color"],
  "root.marginRight": ["root", "px", "right"],
  "root.marginBottom": ["root", "px", "bottom"],
  "root.zIndex": ["root", "exact", "z-index"],
  "root.cursor": ["root", "exact", "cursor"],
  "icon.size": ["svg", "px", "width"],
  "icon.color": ["root", "color", "color"],
  "icon.strokeWidth": ["svg", "px", "stroke-width"],
  "focusRing.width": ["root", "px", "outline-width"],
  "focusRing.offset": ["root", "px", "outline-offset"],
  "focusRing.color": ["root", "color", "outline-color"],
};
