// Avatar Stack 을 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다. 값은
// src/shared/ds/spec/avatar-stack.json, 견본(spec="avatar-stack")은 avatar.demo.tsx 에 있다 — 묶음은 Avatar 와 한 파일이라
// 잴 자리도 이 폴더에 둔다(검사기는 스펙 이름의 폴더에 없으면 다른 폴더의 <스펙>.measure.mjs 를 찾는다).
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 링(바깥 box-shadow)은 두께 · 색을 정하는 묶음의 변수를 잰다 — 아바타 · "+N" 이 물려받는다.
const ITEM = "[data-slot=avatar]";
const OVERFLOW = "[data-slot=avatar-stack-overflow]";

export default {
  "root.gap": [":scope > * + *", "px", "margin-left"],
  "item.radius": [ITEM, "px", "border-top-left-radius"],
  "item.size": [ITEM, "px", "width"],
  "item.outlineWidth": [ITEM, "px", "--avatar-stack-ring-width"],
  "item.outlineColor": [ITEM, "color", "--avatar-stack-ring-color"],
  "overflow.radius": [OVERFLOW, "px", "border-top-left-radius"],
  "overflow.size": [OVERFLOW, "px", "width"],
  "overflow.background": [OVERFLOW, "color", "background-color"],
  "overflow.foreground": [OVERFLOW, "color", "color"],
  "overflow.fontWeight": [OVERFLOW, "exact", "font-weight"],
  "overflow.fontSize": [OVERFLOW, "px", "font-size"],
  "overflow.outlineWidth": [OVERFLOW, "px", "--avatar-stack-ring-width"],
  "overflow.outlineColor": [OVERFLOW, "color", "--avatar-stack-ring-color"],
};
