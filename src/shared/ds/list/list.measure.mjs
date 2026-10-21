// List 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다. 값은 src/shared/ds/spec/list.json.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석. 목록 제목(List Header)은 같은 폴더의 list-header.measure.mjs 가 잰다.
//
// 견본의 뿌리는 목록(ul · 묶음)이고 줄은 하나다(줄마다 한 견본 — 구분선 · 목록 제목은 따로). 줄(item)은 바탕 층(list-background) +
// 콘텐츠 층(list-content: 앞 · 본문 · 뒤)이다. 올림 · 누름은 검사기가 뿌리 가운데를 올리고 · 누르므로 줄의 본문 버튼이 받는다.
// 키보드 포커스는 견본이 목록에서 본문(또는 꺾쇠 단추)으로 넘긴다(list.demo.tsx 의 passFocus).
//
// 하위 줄(nest=parent · child)은 한 목록에서 부모 줄과 하위 줄이 함께 서므로 견본이 따로 표시한다.
//   부모 견본의 꺾쇠 단추 올림 · 누름 · 포커스는 검사기가 뿌리 가운데를 올리고 누르는 방식이라 가운데가 꺾쇠 단추인 좁은 틀에서 잰다
//   (list.demo.tsx 의 ExpandProbe). 줄 본문을 올린 견본에서는 꺾쇠 단추가 올려지지 않으므로 단추의 값을 재지 않고(선택자가 비어 건너뛴다),
//   단추를 올린 견본에서는 줄의 바탕을 재지 않는다 — 두 값이 서로 다른 순간의 값이라서다.
//   하위 줄(nest=child)의 들임은 견본 뿌리의 data-measure="child" 를 보고 하위 줄 묶음 안의 줄에서 잰다.
//
// 재지 않는 값 — list.test.tsx 가 클래스 · 속성으로 본다
//   item.touchTarget · expandButton.touchTarget  "44 × 44" — 문장이다(줄 전체가 누르는 영역 — ::after, 꺾쇠 단추는 보이는 상자)
//   background.transitionDuration · content.transitionDuration · transitionEasing  시간 값 — 계산된 값은 "0.15s" 로 적히고,
//     바탕은 세 속성(색 · 들임 · 모서리)이 한 transition 에 있어 곡선이 속성마다 되풀이된다
//   content.scale · expandButton.scale  "2px 거리 축소" — 문장이다(누르는 순간 줄을 재서 --press-basis 로 넘긴다)
//   expandButton.name · expandButton.transitionProperty  이름(문장)과 두 요소(단추 바탕 · 꺾쇠 회전)에 걸친 전환 속성
//   subList.display  "숨김" · "보임" — 글이다(접힌 하위 줄은 hidden 이고 list.test.tsx 가 본다)
//   tile.background · tile.color  기본값은 "chart-{색}-weak" · "chart-{색}" — 카테고리마다 다른 색이라 스펙에 값이 없다
//     (막히면 bg-disabled · fg-disabled 로 정해져 그 값은 잰다)
//   글꼴(fontFamily)  font-sans 가 src/index.css 의 --font-sans 로 풀려 스펙 글과 글자 그대로 맞지 않는다 — Button · Switch 도 재지 않는다
const CONTENT = "[data-slot=list-content]";
const BODY = "[data-slot=list-body]";
const PREFIX = "[data-slot=list-prefix]";
const SUFFIX = "[data-slot=list-suffix]";
const TILE = "[data-slot=list-tile]";
const EXPAND = "[data-slot=list-expand-button]";
// 바탕 층 — 꺾쇠 단추가 올려지거나 눌린 견본에서는 줄의 바탕이 바뀌지 않으므로 재지 않는다
// (:scope 는 견본 뿌리 — 줄마다 따지면 꺾쇠 단추가 없는 하위 줄의 바탕이 먼저 잡힌다)
const BG = `:scope:not(:has(${EXPAND}:is(:hover, :active))) [data-slot=list-background]`;
// 꺾쇠 단추 — 줄 본문이 올려지거나 눌린 견본에서는 단추의 올림 · 누름 값을 재지 않는다
const EXPAND_ROW_IDLE = `:scope:not(:has(${BODY}:is(:hover, :active))) ${EXPAND}`;

export default {
  "root.gap": ["root", "px", "row-gap"],
  "item.paddingY": [CONTENT, "px", "padding-top"],
  "item.paddingX": [
    CONTENT,
    "px",
    "padding-left",
    { skipIf: "item.paddingLeft" },
  ],
  "item.paddingLeft": [
    `:scope[data-measure=child] [data-slot=list-sub-list] ${CONTENT}, :scope:not([data-measure=child]) ${CONTENT}`,
    "px",
    "padding-left",
  ],
  "item.alignItems": [CONTENT, "exact", "align-items"],
  "item.cursor": ["[data-list-action]", "exact", "cursor"],
  "background.background": [BG, "color", "background-color"],
  "background.insetX": [BG, "px", "left"],
  "background.radius": [BG, "px", "border-top-left-radius"],
  "background.transitionProperty": [BG, "exact", "transition-property"],
  "content.transitionProperty": [CONTENT, "exact", "transition-property"],
  "prefix.paddingRight": [PREFIX, "px", "padding-right"],
  "icon.size": [`${PREFIX} > svg`, "px", "width"],
  "icon.color": [`${PREFIX} > svg`, "color", "color"],
  "tile.size": [TILE, "px", "width"],
  "tile.radius": [TILE, "px", "border-top-left-radius"],
  "tile.iconSize": [`${TILE} > svg`, "px", "width"],
  "tile.background": [TILE, "color", "background-color"],
  "tile.color": [TILE, "color", "color"],
  "body.gap": [BODY, "px", "row-gap"],
  "body.paddingRight": [BODY, "px", "padding-right"],
  // 뒤 붙이개가 길면 본문이 양보한다(Q-001 A). body.minWidth("1em")는 글자 단위 값이라 재지 않는다 — 계산값이 26px(제목 글자 16 + 뒤 여백 10)로
  // 풀려 스펙 글과 맞지 않는다. list.test.tsx 가 클래스로, i02-measure 가 크로미움에서 26 을 본다
  "body.flexGrow": [BODY, "exact", "flex-grow"],
  "title.typography": ["[data-slot=list-title]", "typography"],
  "title.fontWeight": ["[data-slot=list-title]", "exact", "font-weight"],
  "title.overflowWrap": ["[data-slot=list-title]", "exact", "overflow-wrap"],
  "title.foreground": ["[data-slot=list-title]", "color", "color"],
  "detail.typography": ["[data-slot=list-detail]", "typography"],
  "detail.foreground": ["[data-slot=list-detail]", "color", "color"],
  // 글 설명만 — Tag Group 설명은 그 스펙대로 한 줄 말줄임이라 [data-slot=list-detail] 가 글일 때만 잰다
  "detail.overflowWrap": [
    "[data-slot=list-detail]:not(:has([data-slot=tag-group]))",
    "exact",
    "overflow-wrap",
  ],
  "suffix.gap": [SUFFIX, "px", "column-gap"],
  // 좁은 줄(width narrow — 줄 안 폭 < 16em): 값이 본문 아래, 설명 ↔ 값 4 = 본문 사이 2 + 여백 2
  "suffix.marginTop": [SUFFIX, "px", "margin-top"],
  "suffix.textAlign": [SUFFIX, "exact", "text-align"],
  // 금액 · 화살표 · 컨트롤은 줄지 않고, 글로 넘긴 값만 본문이 1em 이 된 뒤에 준다 — list-suffix 의 data-value 로 가른다
  "suffix.shrink": [`${SUFFIX}[data-value=node]`, "exact", "flex-shrink"],
  "suffixText.shrink": [`${SUFFIX}[data-value=text]`, "exact", "flex-shrink"],
  "suffixText.overflowWrap": [
    `${SUFFIX}[data-value=text]`,
    "exact",
    "overflow-wrap",
  ],
  // 값 글자는 뒤 붙이개 자리가 글자 모양을 정하고 안의 글이 그대로 받는다
  "suffixText.typography": [SUFFIX, "typography"],
  "suffixText.foreground": [SUFFIX, "color", "color"],
  "suffixIcon.size": [`${SUFFIX} > svg`, "px", "width"],
  "suffixIcon.color": [`${SUFFIX} > svg`, "color", "color"],
  "divider.height": ["[data-slot=list-divider]", "px", "height"],
  "divider.background": [
    "[data-slot=list-divider]",
    "color",
    "background-color",
  ],
  // 포커스 링 — 본문이 키보드 포커스를 받은 줄의 콘텐츠 층이 그린다(컨트롤 줄은 끼운 컨트롤이 링을 그리므로 건너뛴다)
  "focusRing.width": [
    `${CONTENT}:has(${BODY}:focus-visible)`,
    "px",
    "outline-width",
  ],
  "focusRing.offset": [
    `${CONTENT}:has(${BODY}:focus-visible)`,
    "px",
    "outline-offset",
  ],
  "focusRing.color": [
    `${CONTENT}:has(${BODY}:focus-visible)`,
    "color",
    "outline-color",
  ],
  // 꺾쇠 단추(하위 줄의 부모)
  "expandButton.size": [EXPAND, "px", "width"],
  "expandButton.radius": [EXPAND, "px", "border-top-left-radius"],
  "expandButton.iconSize": [`${EXPAND} > svg`, "px", "width"],
  "expandButton.color": [EXPAND, "color", "color"],
  "expandButton.rotate": [`${EXPAND} > svg`, "exact", "rotate"],
  "expandButton.marginRight": [EXPAND, "px", "margin-right"],
  "expandButton.background": [EXPAND_ROW_IDLE, "color", "background-color"],
  "expandButton.cursor": [EXPAND, "exact", "cursor"],
  "expandButton.outlineWidth": [
    `${EXPAND}:focus-visible`,
    "px",
    "outline-width",
  ],
  "expandButton.outlineOffset": [
    `${EXPAND}:focus-visible`,
    "px",
    "outline-offset",
  ],
  "expandButton.outlineColor": [
    `${EXPAND}:focus-visible`,
    "color",
    "outline-color",
  ],
};
