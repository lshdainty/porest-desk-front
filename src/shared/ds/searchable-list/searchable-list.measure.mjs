// Searchable List 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
// 견본의 첫 요소는 묶음(div[data-slot=searchable-list])이다. 검색칸의 크기는 Input 밑줄형의 상자(text-input)가, 줄은 첫 결과 줄이 갖는다.
// 견본은 크기를 large · medium 으로 정해 둔다(카탈로그는 1440 폭 — responsive 는 medium 으로만 그려진다).
//
// 재지 않는 값
//   field.variant · results.role · groupHeader.variant · option.role · radio.display — 부품 이름 · 역할(문장)이다.
//     searchable-list.test.tsx 가 밑줄형 · listbox · option · 분류 머리(mediumWeak) · 라디오 켬을 본다.
//   results.debounce · results.maxHeight — 시간 · "놓인 자리"(문장). 300ms 는 searchable-list.test.tsx 가 가짜 시계로 본다.
//   option.touchTarget · option.press — 문장. 줄 전체가 눌리는 것 · 고르고 닫는 것(sheet) · 라디오만 바뀌는 것(inline)은 테스트가 본다.
//   highlight.background · insetX · radius — 줄의 ::before(바탕 층)라 요소 자신의 계산된 스타일로 읽을 수 없다.
//     클래스(before:inset-x-x1_5 · before:rounded-r2_5 · data-[highlighted]:before:bg-bg-layer-default-pressed)는 테스트가 본다.
//   option.scale — "2px 거리 축소"(문장). 기준 길이 · 모션 줄이기는 테스트가 본다.
//   prefix.size · prefix.width — 앞 붙이개는 쓰는 쪽이 넣는 Logo Tile · 카드 그림 · Avatar 이고 그 크기는 각자의 스펙이 잰다.
//     줄은 앞 붙이개와 글 사이 12 만 갖는다. 견본의 자리표시는 스펙 크기로 그려 눈으로 줄 높이(64 · 76 · 66)를 본다.
//   status.size · skeleton.size — Result Section · 스켈레톤 줄(문장 · 개수). 줄 높이 · 개수는 테스트가 본다.
//   root.position 은 "sticky" 인 검색칸(field.position)에서 잰다.
const INPUT = "[data-slot=text-input]";
const FIELD = "[data-slot=searchable-list-field]";
const OPTION = "[data-slot=searchable-list-item]";
const CONTENT = "[data-slot=searchable-list-item-content]";
const TITLE = "[data-slot=searchable-list-item-title]";
const DETAIL = "[data-slot=searchable-list-item-detail]";

export default {
  "root.gap": ["root", "px", "row-gap"],
  "field.height": [INPUT, "px", "height"],
  "field.marginX": [FIELD, "px", "padding-left"],
  "field.position": [FIELD, "exact", "position"],
  "option.paddingY": [CONTENT, "px", "padding-top"],
  "option.paddingX": [CONTENT, "px", "padding-left"],
  "option.cursor": [OPTION, "exact", "cursor"],
  "title.typography": [TITLE, "typography"],
  "title.fontWeight": [TITLE, "exact", "font-weight"],
  "title.foreground": [TITLE, "color", "color"],
  "detail.typography": [DETAIL, "typography"],
  "detail.foreground": [DETAIL, "color", "color"],
  "radio.size": ["[data-slot=searchable-list-item-radio]", "px", "width"],
};
