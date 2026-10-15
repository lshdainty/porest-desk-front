// Card 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다. 값은 src/shared/ds/spec/card.json.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 견본의 뿌리는 카드 면이다. 머리 · 제목 · 머리 동작 · 본문 · 지표 · 증감 · 순자산 글은 그 안에서 data-slot 으로 찾는다
// (그 견본에 없으면 재지 않는다 — 지표 조합이 아닌 견본은 지표 값을 건너뛴다).
//
// 재지 않는 값 — card.test.tsx 가 클래스 · 속성으로 본다
//   root.gap  "위아래로 쌓인 카드 사이 8 · 격자 칸 24" — 카드 자신의 속성이 아니라 감싸는 쪽이 정한다(견본 틀이 쌓는 모습으로 본다)
//   root.gradientEnd · heroGlow.background  그라디언트 끝 색 · 장식 빛 — 계산된 background-color 가 아니라 background-image 라 잴 수 없다
//   root.transitionDuration · transitionEasing · scaleDuration · scaleEasing  시간 값 — 계산된 값은 "0.15s, 0.15s" 로 속성마다 되풀이된다
//   root.scale · headerAction.scale  "2px 거리 축소" — 문장이다(누르는 순간 카드를 재서 --press-basis 로 넘긴다)
//   headerAction.touchTarget  "44 × 44" — 문장이다(::before 가 보이는 상자 밖으로 44 를 만든다)
//   headerAction.background(hovered · pressed)  견본의 뿌리가 카드라 머리 동작을 올리거나 누를 수 없다 — card.test.tsx 가 클래스로 본다
//   list.itemRadius  10 — 줄 바탕은 올리거나 누른 순간에만 둥글어진다(쉴 때는 0) — 카드는 List 기본값 10(카드 16 − 6)을 그대로 두고
//     card.test.tsx 가 List 가 --list-item-radius 를 덮지 않는지 본다
//   글꼴(fontFamily)  font-sans 가 src/index.css 의 --font-sans 로 풀려 스펙 글과 글자 그대로 맞지 않는다
const HEADER = "[data-slot=card-header]";
const TITLE = "[data-slot=card-title]";
const ACTION = "[data-slot=card-action]";
const STAT_LABEL = "[data-slot=card-stat-label]";
const STAT_VALUE = "[data-slot=card-stat-value]";
const DELTA = "[data-slot=delta]";
const DELTA_VALUE = "[data-slot=delta-value]";
const DELTA_TEXT = "[data-slot=delta-text]";
const HERO_GLOW = "[data-slot=card-hero-glow]";
const HERO_LABEL = "[data-slot=card-hero-label]";
const HERO_AMOUNT = "[data-slot=card-hero-amount]";
const HERO_DETAIL = "[data-slot=card-hero-detail]";

export default {
  "root.background": ["root", "color", "background-color"],
  "root.borderWidth": ["root", "px", "border-top-width"],
  "root.borderColor": ["root", "color", "border-top-color"],
  "root.shadow": ["root", "exact", "box-shadow"],
  "root.radius": ["root", "px", "border-top-left-radius"],
  "root.padding": ["root", "px", "padding-left"],
  "root.paddingBottom": ["root", "px", "padding-bottom"],
  "root.overflow": ["root", "exact", "overflow"],
  "root.cursor": ["root", "exact", "cursor"],
  "root.transitionProperty": ["root", "exact", "transition-property"],
  "header.alignItems": [HEADER, "exact", "align-items"],
  "header.justifyContent": [HEADER, "exact", "justify-content"],
  "header.gap": [HEADER, "px", "column-gap"],
  "header.paddingX": [HEADER, "px", "padding-left"],
  "header.paddingTop": [HEADER, "px", "padding-top"],
  "header.paddingBottom": [HEADER, "px", "padding-bottom"],
  "title.typography": [TITLE, "typography"],
  "title.fontWeight": [TITLE, "exact", "font-weight"],
  "title.foreground": [TITLE, "color", "color"],
  "headerAction.height": [ACTION, "px", "height"],
  "headerAction.paddingLeft": [ACTION, "px", "padding-left"],
  "headerAction.paddingRight": [ACTION, "px", "padding-right"],
  "headerAction.radius": [ACTION, "px", "border-top-left-radius"],
  "headerAction.typography": [ACTION, "typography"],
  "headerAction.fontWeight": [ACTION, "exact", "font-weight"],
  "headerAction.foreground": [ACTION, "color", "color"],
  "headerAction.iconSize": [`${ACTION} > svg`, "px", "width"],
  "headerAction.gap": [ACTION, "px", "column-gap"],
  "content.gap": ["[data-slot=card-content]", "px", "row-gap"],
  "statLabel.typography": [STAT_LABEL, "typography"],
  "statLabel.fontWeight": [STAT_LABEL, "exact", "font-weight"],
  "statLabel.foreground": [STAT_LABEL, "color", "color"],
  "statValue.typography": [STAT_VALUE, "typography"],
  "statValue.fontWeight": [STAT_VALUE, "exact", "font-weight"],
  "statValue.foreground": [STAT_VALUE, "color", "color"],
  "statValue.numerals": [STAT_VALUE, "exact", "font-variant-numeric"],
  "statValue.marginTop": [STAT_VALUE, "px", "margin-top"],
  "delta.typography": [DELTA, "typography"],
  "delta.fontWeight": [DELTA_VALUE, "exact", "font-weight"],
  "delta.numerals": [DELTA_VALUE, "exact", "font-variant-numeric"],
  "delta.marginTop": [DELTA, "px", "margin-top"],
  "delta.foreground": [DELTA_VALUE, "color", "color"],
  "deltaText.typography": [DELTA_TEXT, "typography"],
  "deltaText.fontWeight": [DELTA_TEXT, "exact", "font-weight"],
  "deltaText.foreground": [DELTA_TEXT, "color", "color"],
  "deltaText.gap": [DELTA, "px", "column-gap"],
  "heroGlow.size": [HERO_GLOW, "px", "width"],
  "heroLabel.typography": [HERO_LABEL, "typography"],
  "heroLabel.fontWeight": [HERO_LABEL, "exact", "font-weight"],
  "heroLabel.foreground": [HERO_LABEL, "color", "color"],
  "heroAmount.typography": [HERO_AMOUNT, "typography"],
  "heroAmount.fontWeight": [HERO_AMOUNT, "exact", "font-weight"],
  "heroAmount.foreground": [HERO_AMOUNT, "color", "color"],
  "heroAmount.numerals": [HERO_AMOUNT, "exact", "font-variant-numeric"],
  "heroAmount.marginTop": [HERO_AMOUNT, "px", "margin-top"],
  "heroDetail.typography": [HERO_DETAIL, "typography"],
  "heroDetail.fontWeight": [HERO_DETAIL, "exact", "font-weight"],
  "heroDetail.foreground": [HERO_DETAIL, "color", "color"],
  "heroDetail.marginTop": [HERO_DETAIL, "px", "margin-top"],
  // 포커스 링 — 키보드 포커스를 받은 카드 바깥(whole)
  "focusRing.width": ["root", "px", "outline-width"],
  "focusRing.offset": ["root", "px", "outline-offset"],
  "focusRing.color": ["root", "color", "outline-color"],
};
