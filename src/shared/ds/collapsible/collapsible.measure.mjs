// Collapsible 을 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다. 값은 src/shared/ds/spec/collapsible.json.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 견본의 뿌리는 폰 폭(390)의 면이고 Collapsible 은 그 안이다 — 모든 값은 선택자로 잰다. 경고 상자(surface warning)는 화면이 그리는
// 상자라 견본이 그린 상자(collapsible-box)를 뿌리로 올리고 누르며, 상자의 값(box.*)은 그 상자에서 잰다. 올림 · 누름은 검사기가 뿌리
// 가운데를 올리고 누르므로 접힌 견본에서 트리거가 받는다. 키보드 포커스는 견본이 트리거로 넘긴다(collapsible.demo.tsx 의 passFocus).
// 트리거는 두 층이다 — 바탕 층(collapsible-background)과 콘텐츠 층(collapsible-trigger-content). 모양은 Accordion 트리거와 같다.
//
// 재지 않는 값 — collapsible.test.tsx 가 클래스 · 속성으로 본다
//   heading.level · panel.display · trigger.touchTarget  글이다(머리말 단계 · 보임 · 숨김 · 문장)
//   *.transitionProperty · *.transitionDuration · *.transitionEasing  시간 값
//   content.scale  "2px 거리 축소" — 문장이다
//   chevron.rotate  접힘 0deg 는 계산된 값이 none 이고 펼침은 300ms 동안 돈다 — 클래스(rotate-180)로 본다
//   root.overflow · box.overflow  재지만 hidden 만 본다(아래)
//   글꼴(fontFamily)  font-sans 가 --font-sans 로 풀려 스펙 글과 글자 그대로 맞지 않는다
const TRIGGER = "[data-slot=collapsible-trigger]";
const BG = "[data-slot=collapsible-background]";
const CONTENT = "[data-slot=collapsible-trigger-content]";
const TITLE = "[data-slot=collapsible-title]";
const DESC = "[data-slot=collapsible-description]";
const PANEL = "[data-slot=collapsible-content-inner]";
const ROOT = "[data-slot=collapsible]";
const BOX = "[data-slot=collapsible-box]";

export default {
  "root.background": [ROOT, "color", "background-color"],
  "root.borderWidth": [ROOT, "px", "border-top-width"],
  "root.borderColor": [ROOT, "color", "border-top-color"],
  "root.radius": [ROOT, "px", "border-top-left-radius"],
  "root.overflow": [ROOT, "exact", "overflow"],
  "box.background": [BOX, "color", "background-color"],
  "box.borderWidth": [BOX, "px", "border-top-width"],
  "box.borderColor": [BOX, "color", "border-top-color"],
  "box.radius": [BOX, "px", "border-top-left-radius"],
  "box.overflow": [BOX, "exact", "overflow"],
  "box.paddingTop": [
    "[data-slot=collapsible-box] > div:first-child",
    "px",
    "padding-top",
  ],
  "box.paddingX": [
    "[data-slot=collapsible-box] > div:first-child",
    "px",
    "padding-left",
  ],
  "box.paddingBottom": [
    "[data-slot=collapsible-box] > div:first-child",
    "px",
    "padding-bottom",
  ],
  "trigger.minHeight": [TRIGGER, "px", "min-height"],
  "trigger.paddingY": [CONTENT, "px", "padding-top"],
  "trigger.paddingX": [CONTENT, "px", "padding-left"],
  "trigger.textAlign": [TRIGGER, "exact", "text-align"],
  "trigger.cursor": [TRIGGER, "exact", "cursor"],
  "background.background": [BG, "color", "background-color"],
  "background.insetX": [BG, "px", "left"],
  "background.radius": [BG, "px", "border-top-left-radius"],
  "content.gap": [CONTENT, "px", "column-gap"],
  "content.alignItems": [CONTENT, "exact", "align-items"],
  "body.gap": ["[data-slot=collapsible-trigger-body]", "px", "row-gap"],
  "title.typography": [TITLE, "typography"],
  "title.fontWeight": [TITLE, "exact", "font-weight"],
  "title.foreground": [TITLE, "color", "color"],
  "title.lineClamp": [TITLE, "exact", "-webkit-line-clamp"],
  "description.typography": [DESC, "typography"],
  "description.fontWeight": [DESC, "exact", "font-weight"],
  "description.foreground": [DESC, "color", "color"],
  "description.lineClamp": [DESC, "exact", "-webkit-line-clamp"],
  "chevron.size": ["[data-slot=collapsible-chevron]", "px", "width"],
  "chevron.color": ["[data-slot=collapsible-chevron]", "color", "color"],
  "panel.paddingTop": [PANEL, "px", "padding-top"],
  "panel.paddingX": [PANEL, "px", "padding-left"],
  "panel.paddingBottom": [PANEL, "px", "padding-bottom"],
  "panel.maxHeight": [PANEL, "exact", "max-height"],
  "focusRing.width": [TRIGGER, "px", "outline-width"],
  "focusRing.offset": [TRIGGER, "px", "outline-offset"],
  "focusRing.color": [TRIGGER, "color", "outline-color"],
  "focusRing.radius": [TRIGGER, "px", "border-top-left-radius"],
  "divider.height": [ROOT, "px", "border-top-width"],
  "divider.background": [ROOT, "color", "border-top-color"],
};
