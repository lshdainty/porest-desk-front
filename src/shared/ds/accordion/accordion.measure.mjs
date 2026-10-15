// Accordion 을 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다. 값은 src/shared/ds/spec/accordion.json.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 견본의 뿌리는 폰 폭(390)의 면(Frame)이고 아코디언은 그 안이다 — 그래서 모든 값은 선택자로 잰다(뿌리 자체는 재지 않는다).
// 올림 · 누름은 검사기가 뿌리 가운데를 올리고 누르므로 항목이 하나인 견본에서 트리거가 받는다. 키보드 포커스는 견본이 트리거로 넘긴다
// (accordion.demo.tsx 의 passFocus). 트리거는 두 층이다 — 바탕 층(accordion-background: 누름 · 호버 바탕)과 콘텐츠 층(accordion-trigger-content).
// 상세가 없는 줄(AccordionPlainItem)은 트리거가 없어 :is() 로 같은 위아래 · 좌우 · 높이를 줄의 콘텐츠 층에서 잰다.
//
// 재지 않는 값 — accordion.test.tsx 가 클래스 · 속성으로 본다
//   heading.level · panel.display · chevron.display · root.items · trigger.touchTarget · expandAll.touchTarget · expandAll.label · expandAll.position
//     글이다(머리말 단계 · 보임 · 숨김 · 없음 · 문장)
//   *.transitionProperty · *.transitionDuration · *.transitionEasing  시간 값 — 계산된 값은 "0.15s" 로 적히고 바탕은 세 속성이 한 transition 에 있다
//   content.scale · expandAll.scale  "2px 거리 축소" — 문장이다(누르는 순간 줄을 재서 --press-basis 로 넘긴다)
//   chevron.rotate  접힘 0deg 는 계산된 값이 none 이고 펼침은 300ms 동안 돈다 — 클래스(rotate-180)로 본다
//   scrollbar · 스크롤  해당 없음
//   글꼴(fontFamily)  font-sans 가 src/index.css 의 --font-sans 로 풀려 스펙 글과 글자 그대로 맞지 않는다 — Button · Switch 도 재지 않는다
const TRIGGER = "[data-slot=accordion-trigger]";
const BG = "[data-slot=accordion-background]";
// 트리거의 콘텐츠 층 — 상세가 없는 줄은 줄의 콘텐츠 층
const CONTENT =
  ":is([data-slot=accordion-trigger-content], [data-slot=accordion-plain-item-content])";
const LINE = `:is(${TRIGGER}, [data-slot=accordion-plain-item-content])`;
const BODY = "[data-slot=accordion-trigger-body]";
const TITLE = "[data-slot=accordion-title]";
const DESC = "[data-slot=accordion-description]";
const PANEL = "[data-slot=accordion-content-text]";
const HEADER = "[data-slot=accordion-header]";
const HEADER_TITLE = "[data-slot=accordion-header-title]";
const EXPAND_ALL = "[data-slot=accordion-expand-all]";

export default {
  "root.gap": ["[data-slot=accordion]", "px", "row-gap"],
  "item.background": ["[data-accordion-row]", "color", "background-color"],
  "item.borderWidth": ["[data-accordion-row]", "px", "border-top-width"],
  "item.borderColor": ["[data-accordion-row]", "color", "border-top-color"],
  "item.radius": ["[data-accordion-row]", "px", "border-top-left-radius"],
  "item.shadow": ["[data-accordion-row]", "exact", "box-shadow"],
  "item.overflow": ["[data-accordion-row]", "exact", "overflow"],
  "trigger.minHeight": [LINE, "px", "min-height"],
  "trigger.paddingY": [CONTENT, "px", "padding-top"],
  "trigger.paddingX": [CONTENT, "px", "padding-left"],
  "trigger.textAlign": [TRIGGER, "exact", "text-align"],
  "trigger.cursor": [LINE, "exact", "cursor"],
  "background.background": [BG, "color", "background-color"],
  "background.insetX": [BG, "px", "left"],
  "background.radius": [BG, "px", "border-top-left-radius"],
  "content.gap": [CONTENT, "px", "column-gap"],
  "content.alignItems": [CONTENT, "exact", "align-items"],
  "prefixIcon.size": ["[data-slot=accordion-prefix-icon] > svg", "px", "width"],
  "prefixIcon.color": ["[data-slot=accordion-prefix-icon]", "color", "color"],
  "body.gap": [BODY, "px", "row-gap"],
  "title.typography": [TITLE, "typography"],
  "title.fontWeight": [TITLE, "exact", "font-weight"],
  "title.foreground": [TITLE, "color", "color"],
  "title.lineClamp": [TITLE, "exact", "-webkit-line-clamp"],
  "description.typography": [DESC, "typography"],
  "description.fontWeight": [DESC, "exact", "font-weight"],
  "description.foreground": [DESC, "color", "color"],
  "description.lineClamp": [DESC, "exact", "-webkit-line-clamp"],
  "chevron.size": ["[data-slot=accordion-chevron]", "px", "width"],
  "chevron.color": ["[data-slot=accordion-chevron]", "color", "color"],
  "panel.paddingTop": [PANEL, "px", "padding-top"],
  "panel.paddingX": [PANEL, "px", "padding-left"],
  "panel.paddingBottom": [PANEL, "px", "padding-bottom"],
  "panel.maxHeight": [PANEL, "exact", "max-height"],
  "panelText.typography": [PANEL, "typography"],
  "panelText.fontWeight": [PANEL, "exact", "font-weight"],
  "panelText.foreground": [PANEL, "color", "color"],
  "header.minHeight": [HEADER, "px", "min-height"],
  "header.alignItems": [HEADER, "exact", "align-items"],
  "header.justifyContent": [HEADER, "exact", "justify-content"],
  "header.gap": [HEADER, "px", "column-gap"],
  "header.marginBottom": [HEADER, "px", "margin-bottom"],
  "headerTitle.typography": [HEADER_TITLE, "typography"],
  "headerTitle.fontWeight": [HEADER_TITLE, "exact", "font-weight"],
  "headerTitle.foreground": [HEADER_TITLE, "color", "color"],
  "expandAll.height": [EXPAND_ALL, "px", "height"],
  "expandAll.paddingLeft": [EXPAND_ALL, "px", "padding-left"],
  "expandAll.paddingRight": [EXPAND_ALL, "px", "padding-right"],
  "expandAll.radius": [EXPAND_ALL, "px", "border-top-left-radius"],
  "expandAll.typography": [EXPAND_ALL, "typography"],
  "expandAll.fontWeight": [EXPAND_ALL, "exact", "font-weight"],
  "expandAll.foreground": [EXPAND_ALL, "color", "color"],
  "expandAll.iconSize": [`${EXPAND_ALL} svg`, "px", "width"],
  "expandAll.gap": [EXPAND_ALL, "px", "column-gap"],
  "expandAll.background": [EXPAND_ALL, "color", "background-color"],
  "focusRing.width": [TRIGGER, "px", "outline-width"],
  "focusRing.offset": [TRIGGER, "px", "outline-offset"],
  "focusRing.color": [TRIGGER, "color", "outline-color"],
  "focusRing.radius": [TRIGGER, "px", "border-top-left-radius"],
  "expandAll.outlineWidth": [EXPAND_ALL, "px", "outline-width"],
  "expandAll.outlineOffset": [EXPAND_ALL, "px", "outline-offset"],
  "expandAll.outlineColor": [EXPAND_ALL, "color", "outline-color"],
  "divider.height": ["[data-slot=accordion-divider]", "px", "height"],
  "divider.background": [
    "[data-slot=accordion-divider]",
    "color",
    "background-color",
  ],
  "divider.marginX": ["[data-slot=accordion-divider]", "px", "margin-left"],
};
