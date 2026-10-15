// Scroll Area 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다. 값은 src/shared/ds/spec/scroll-area.json.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 견본의 뿌리가 곧 스크롤 상자다(ScrollArea). 키보드 포커스는 검사기가 뿌리에 주면 초점을 받는 상자(focusable none)가 받는다.
// 넘치는 방향만 스크롤하므로 견본은 세로 상자이고 overflow-y 로 잰다(가로 줄 견본은 both).
//
// 재지 않는 값 — 스크롤바 · 스크롤바 막대 · 바탕 · Firefox 규칙(scrollbar.* · thumb.* · track.* · firefox.*)
//   스크롤바는 ::-webkit-scrollbar 가상 요소 · @supports 안의 규칙이라 getComputedStyle 이 읽지 못한다(검사기가 가상 요소를 읽지 못한다).
//   6px · 알약 · stroke-neutral-solid 는 src/index.css 한 곳에 있고, 크로미움에서 쟀다(scroll-area.test.tsx 머리에 적은 일회성 측정).
//   box.tabIndex · box.role · box.name  속성 · 문장이다 — scroll-area.test.tsx 가 본다
//   scrollbar.display  "늘 보임" · "숨김" 글이다(가로 줄은 .scrollbar-hide, 견본이 건다)
export default {
  "box.overflow": ["root", "exact", "overflow-y"],
  "box.overscrollBehavior": ["root", "exact", "overscroll-behavior"],
  "focusRing.width": ["root", "px", "outline-width"],
  "focusRing.offset": ["root", "px", "outline-offset"],
  "focusRing.color": ["root", "color", "outline-color"],
};
