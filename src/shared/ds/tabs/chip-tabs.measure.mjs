// Chip Tabs 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 견본의 뿌리는 목록(role=tablist)이고 탭(칩)은 셋이다 — 탭 · 알림 점은 둘째 탭에서 잰다. 칩 하나의 색 · 크기 · 상태는 chip.yaml 이
// 정하고 chip.measure.mjs 가 잰다(여기서는 칩의 높이 · 줄어들지 않음만).
//
// 재지 않는 값
//   trigger.chip                        "Chip Solid" · "Chip Outline Strong" — 문장이다(tabs.test.tsx 가 chipVariants 의 변형을 본다)
//   list.fog                            "좌우 20px" — 문장이다(tabs.test.tsx 가 data-scroll-fog 를 본다)
//   notification.gap                    "글 뒤 6" 은 칩의 gap(6)이다 — chip.measure.mjs 의 root.gap 이 잰다
const TRIGGER = "[role=tab]:nth-of-type(2)";
const NOTIFICATION = "[data-slot=chip-tabs-notification]";

export default {
  "list.paddingX": ["root", "px", "padding-left"],
  "list.paddingY": ["root", "px", "padding-top"],
  "list.gap": ["root", "px", "column-gap"],
  "list.overflowX": ["root", "exact", "overflow-x"],
  "list.scrollPadding": ["root", "px", "scroll-padding-left"],
  "trigger.shrink": [TRIGGER, "exact", "flex-shrink"],
  "trigger.height": [TRIGGER, "px", "height"],
  "notification.size": [NOTIFICATION, "px", "width"],
  "notification.radius": [NOTIFICATION, "px", "border-top-left-radius"],
  "notification.background": [NOTIFICATION, "color", "background-color"],
};
