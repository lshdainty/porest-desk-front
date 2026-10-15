// Swipe Actions 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 견본의 첫 요소(root)는 동작 칸 하나(SwipeActionCell — 버튼)다. 올림 · 누름 · 키보드 초점이 그 칸에 걸리게 줄 전체가 아니라 칸을 견본으로 잰다.
//
// 재지 않는 것(문장 · 계산 · 모션 · 그림자라 swipe-actions.test.tsx 가 맡는다)
//   - action.brightness   "88%" 는 문장이다(계산값은 filter: brightness(0.88)) — 클래스를 테스트가 맞춘다
//   - action.transform    "translateX(0)" — 누를 때 움직이지 않는다는 규칙이라 계산값("none")과 글로 비교되지 않는다. 테스트가 맡는다
//   - action.height · width · paddingX · touchTarget   "줄 높이" · "배지 + 앞 간격" 같은 문장이다 — 칸 폭 56 · 48 · 안쪽 간격은 테스트가 잰다
//   - badge.background "kind 색"   종류마다 아래 키가 값을 준다
//   - badge.radius(9999)   rounded-full 은 계산값이 매우 큰 수라 9999 와 같게 비교되지 않는다
//   - badge.borderWidth · borderColor(neutral)   안쪽 1px 은 inset box-shadow 다 — 계산된 box-shadow 는 색이 앞에 오는 글이다. 테스트가 클래스를 본다
//   - label.typography · label.lineHeight   스펙 typography 는 t2(12 / 16)이고 이 컴포넌트는 줄 높이만 1.3 으로 덮는다(15.6) — 크기 · 굵기는
//     label.fontWeight 가 잰다, 줄 높이 1.3 은 테스트가 클래스로 본다
//   - moreButton.size(40)   줄 끝 ⋮ 는 Button ghost · iconOnly · medium 그대로다 — 크기는 button 스펙의 ds:check 가 잰다(테스트가 그 세 속성을 맞춘다)
//   - 열림 · 닫힘 모션(150ms · motion-ease-enter)   시간은 문장이다 — 테스트가 클래스를 본다
const BADGE = "[data-slot=swipe-action-badge]";
const ICON = "[data-slot=swipe-action-badge] > svg";
const LABEL = "[data-slot=swipe-action-label]";

export default {
  "badge.background": [BADGE, "color", "background-color"],
  "badge.size": [BADGE, "px", "width"],
  "icon.size": [ICON, "px", "width"],
  "icon.color": [ICON, "color", "color"],
  "label.color": [LABEL, "color", "color"],
  "label.fontWeight": [LABEL, "exact", "font-weight"],
  "action.gap": ["root", "px", "row-gap"],
  "action.paddingY": ["root", "px", "padding-top"],
  "action.cursor": ["root", "exact", "cursor"],
  "action.shadow": ["root", "exact", "box-shadow"],
  "focusRing.width": ["root", "px", "outline-width"],
  "focusRing.offset": ["root", "px", "outline-offset"],
  "focusRing.color": ["root", "color", "outline-color"],
};
