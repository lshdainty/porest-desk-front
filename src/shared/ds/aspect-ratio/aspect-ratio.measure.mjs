// Aspect Ratio 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// root.width(부모 폭) · root.height(폭 ÷ 비율)는 문장이라 재지 않는다.
// root.aspectRatio — 크로미움은 계산된 aspect-ratio 를 늘 "a / b" 로 쓴다(1 → "1 / 1"). 스펙 JSON 은 1 · 2 · 1.586 은
// 숫자, 16 / 9 · 4 / 3 · 6 / 7 · 4 / 5 · 2 / 3 은 글("16 / 9")이라 한 가지 재는 법으로는 다 맞출 수 없다 — px(숫자를
// parseFloat 로)로 숫자 셋만 잰다(글은 검사기가 건너뛴다). 여덟을 다 재려면 비율을 나눠 맞추는 재는 법이 필요하다.
export default {
  "root.radius": ["root", "px", "border-top-left-radius"],
  "root.background": ["root", "color", "background-color"],
  "root.overflow": ["root", "exact", "overflow"],
  "root.aspectRatio": ["root", "px", "aspect-ratio"],
  "child.inset": [":scope > *", "px", "inset"],
  // img · video 자식만 — 빗금 span 은 cover 를 받지 않는다
  "child.objectFit": [":scope > img, :scope > video", "exact", "object-fit"],
};
