// Aspect Ratio 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// root.width(부모 폭) · root.height(폭 ÷ 비율)는 문장이라 재지 않는다.
// root.aspectRatio — 크로미움은 계산된 aspect-ratio 를 늘 "a / b" 로 쓴다(1 → "1 / 1"). 스펙 JSON 의 비율은 여덟 모두
// "W / H" 글("1 / 1" · "2 / 1" · "16 / 9" · "4 / 3" · "6 / 7" · "4 / 5" · "2 / 3" · "1.586 / 1")이라 글 그대로(exact) 맞춘다
// (groo-design 2026-10-08 — 전엔 1 · 2 · 1.586 만 숫자라 px 로 셋만 쟀고 나머지 다섯은 건너뛰었다).
export default {
  "root.radius": ["root", "px", "border-top-left-radius"],
  "root.background": ["root", "color", "background-color"],
  "root.overflow": ["root", "exact", "overflow"],
  "root.aspectRatio": ["root", "exact", "aspect-ratio"],
  "child.inset": [":scope > *", "px", "inset"],
  // img · video 자식만 — 빗금 span 은 cover 를 받지 않는다
  "child.objectFit": [":scope > img, :scope > video", "exact", "object-fit"],
};
