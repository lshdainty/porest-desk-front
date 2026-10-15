// Input OTP 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
// 견본은 틀(div) 하나다 — 안에 Field(라벨 · 코드 칸 · 설명 줄) + 다시 받기 단추가 있고, 부위는 data-slot · id 끝말로 찾는다.
// 코드 칸의 상자 · 글자는 Input 그대로(input.measure.mjs 와 같은 자리). 키보드 포커스는 검사기가 틀에 주면 견본이 코드 칸으로 넘긴다.
// 재지 않는 값(input-otp.test.tsx 가 맡는다)
//   field.variant · width · breakpoint · borderColor  Input 이 정한 모양 · 놓인 자리 폭 · 1280 미디어 쿼리 · 안쪽 1px 그림자(요소 값이 아니다 — input.measure.mjs 와 같은 까닭)
//   value.numerals · textAlign · inputMode · autoComplete · filter · autoSubmit  글로 된 동작 값 — 속성 · 붙여넣기는 테스트가 본다
//   placeholder.*  ::placeholder 가상 요소
//   description.content · resend.label · resend.focus · resend.cooldown  문장 · 동작 값(남은 초는 테스트가 시계를 돌려 본다)
//   resend.variant  Button 의 변형 이름(neutralWeak) — 단추 색은 resend.background · foreground 가 막힘일 때만 스펙에 있다
const FIELD = "[data-slot=text-input]";
const VALUE = "[data-slot=text-input-value]";
const RESEND = "[data-slot=input-otp-resend]";
export default {
  "field.background": [FIELD, "color", "background-color"],
  "field.minHeight": [FIELD, "px", "min-height"],
  "field.radius": [FIELD, "px", "border-top-left-radius"],
  "field.paddingX": [`${VALUE}:first-child`, "px", "padding-left"],
  "value.foreground": [VALUE, "color", "color"],
  "value.typography": [VALUE, "typography"],
  "description.typography": ["[id$=description], [id$=error]", "typography"],
  "description.foreground": [
    "[id$=description], [id$=error]",
    "color",
    "color",
  ],
  "resend.height": [RESEND, "px", "height"],
  "resend.marginTop": [RESEND, "px", "margin-top"],
  "resend.background": [RESEND, "color", "background-color"],
  "resend.foreground": [RESEND, "color", "color"],
  "resend.cursor": [RESEND, "exact", "cursor"],
};
