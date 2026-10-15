// Toggle 을 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 견본의 뿌리는 단추(<button aria-pressed>) 하나다. 아이콘은 그 안의 svg 다.
//
// 재지 않는 값
//   root.touchTarget · pressed 의 scale · scaleDuration · scaleEasing  44 × 44 영역(::before) · 2px 거리 축소는 문장 · 시간이다 —
//                                      toggle.test.tsx 가 클래스를 본다
//   root.transitionProperty · Duration · Easing  색 전환(150ms)과 축소 전환(scale)이 한 transition 속성에 이어 붙어 있다 —
//                                      toggle.test.tsx 가 클래스를 본다
//   root.name                          "고정" — 말이다(toggle.test.tsx 가 aria-label · aria-pressed 를 본다)
//   motion 의 켬 ↔ 끔 0ms              아이콘 · 굵기 · 색은 전환이 없다 — toggle.test.tsx 가 클래스에 transition 이 없음을 본다
const ICON = "[data-slot=toggle-icon] > svg";

export default {
  "root.size": ["root", "px", "width"],
  "root.radius": ["root", "px", "border-top-left-radius"],
  "root.background": ["root", "color", "background-color"],
  "root.cursor": ["root", "exact", "cursor"],
  "icon.size": [ICON, "px", "width"],
  "icon.strokeWidth": [ICON, "px", "stroke-width"],
  "icon.color": [ICON, "color", "color"],
  "focusRing.width": ["root", "px", "outline-width"],
  "focusRing.offset": ["root", "px", "outline-offset"],
  "focusRing.color": ["root", "color", "outline-color"],
};
