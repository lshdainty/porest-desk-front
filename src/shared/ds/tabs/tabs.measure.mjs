// Tabs(Line)를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 견본의 뿌리는 목록(role=tablist)이고 탭은 셋이다 — 탭 · 글 · 알림 점 · 포커스 링은 가운데 탭(둘째 탭)에서 잰다.
// 검사기가 목록 가운데를 올리고 · 누르면 가운데 탭이 눌리고(Fill 일 때), 목록에 포커스를 주면 Radix 가 고른 탭으로 넘긴다
// (그래서 포커스 견본은 가운데 탭을 고른 것만 둔다 — tabs.demo.tsx 머리).
//
// 재지 않는 값
//   list.borderBottomColor · borderBottomWidth  안쪽 1px box-shadow 라 재는 법(px · color · exact · typography)으로 읽히지 않는다 —
//                                      tabs.test.tsx 가 클래스를 본다
//   trigger.touchTarget                 "탭 전체" — 문장이다(목록 높이가 곧 누르는 높이 — min-h 를 trigger.minHeight 가 잰다)
//   trigger.scale · scaleDuration · scaleEasing  2px 거리 축소 · 시간 — tabs.test.tsx 가 클래스를 본다
//   indicator.insetX                    막대는 탭의 offsetLeft · offsetWidth 를 재서 변수로 놓는다 — 들임(16 · 0)은 목록의
//                                      --tabs-indicator-inset 변수이고 tabs.test.tsx 가 본다
//   indicator.transitionDuration · transitionEasing  시간 · 곡선 — 계산값이 "0.2s" · "cubic-bezier(…)" 라 스펙의 글과 같지 않다
//   notification.gap                    "글 끝에서 2" 는 left: calc(100% + 2px) 라 그 자체로 읽히지 않는다 — tabs.test.tsx 가 클래스를 본다
const TRIGGER = "[role=tab]:nth-of-type(2)";
const LABEL = `${TRIGGER} [data-slot=tabs-label]`;
const INDICATOR = "[data-slot=tabs-indicator]";
const NOTIFICATION = "[data-slot=tabs-notification]";

export default {
  "list.background": ["root", "color", "background-color"],
  "list.minHeight": ["root", "px", "min-height"],
  "list.paddingX": ["root", "px", "padding-left"],
  "list.overflowX": ["root", "exact", "overflow-x"],
  "list.scrollPadding": ["root", "px", "scroll-padding-left"],
  "trigger.paddingX": [TRIGGER, "px", "padding-left"],
  "trigger.paddingY": [TRIGGER, "px", "padding-top"],
  "trigger.alignItems": [TRIGGER, "exact", "align-items"],
  "trigger.cursor": [TRIGGER, "exact", "cursor"],
  "trigger.minHeight": [TRIGGER, "px", "min-height"],
  "trigger.grow": [TRIGGER, "exact", "flex-grow"],
  "label.typography": [LABEL, "typography"],
  "label.fontWeight": [LABEL, "exact", "font-weight"],
  "label.foreground": [LABEL, "color", "color"],
  "indicator.height": [INDICATOR, "px", "height"],
  "indicator.background": [INDICATOR, "color", "background-color"],
  "indicator.radius": [INDICATOR, "px", "border-top-left-radius"],
  "indicator.transitionProperty": [INDICATOR, "exact", "transition-property"],
  "notification.size": [NOTIFICATION, "px", "width"],
  "notification.radius": [NOTIFICATION, "px", "border-top-left-radius"],
  "notification.background": [NOTIFICATION, "color", "background-color"],
  "focusRing.width": [TRIGGER, "px", "outline-width"],
  "focusRing.offset": [TRIGGER, "px", "outline-offset"],
  "focusRing.color": [TRIGGER, "color", "outline-color"],
};
