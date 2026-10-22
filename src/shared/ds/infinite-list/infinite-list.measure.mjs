// Infinite List 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다. 값은 src/shared/ds/spec/infinite-list.json.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 견본의 뿌리는 목록 끝 자리(div) 하나다. 상태(status)마다 견본이 따로 서고, 상태에 없는 부분(끝 상태의 원 · 다시 시도)은 건너뛴다.
//
// 재지 않는 값 — infinite-list.test.tsx 가 동작 · 클래스로 본다
//   sentinel.threshold  "300px" — 받는 시점이다(IntersectionObserver rootMargin, 테스트가 인자를 본다)
//   progress.size  원 24 — 값은 Progress Circle 의 상자 크기(--pc-size)라 ProgressCircle 의 스펙(progress-circle.measure.mjs)이 잰다. 여기서는 상자 폭을 잰다
//   retryButton.buttonSize  "small 36" — Button 의 크기 이름이다(Button 스펙이 잰다). 높이는 아래 retryButton.height 로 36 을 본다
//   글꼴(fontFamily)  font-sans 가 src/index.css 의 --font-sans 로 풀려 스펙 글과 글자 그대로 맞지 않는다
const MESSAGE = "[data-slot=infinite-list-end-message] > p";
const RETRY = "[data-slot=infinite-list-end-retry]";

export default {
  "root.paddingY": ["root", "px", "padding-top"],
  "root.justifyContent": ["root", "exact", "justify-content"],
  "progress.size": ["[data-slot=infinite-list-end-progress]", "px", "width"],
  "message.typography": [MESSAGE, "typography"],
  "message.fontWeight": [MESSAGE, "exact", "font-weight"],
  "message.foreground": [MESSAGE, "color", "color"],
  "retryButton.marginTop": [RETRY, "px", "margin-top"],
};
