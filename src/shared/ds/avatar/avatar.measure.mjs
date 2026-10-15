// Avatar 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 재지 않는 값
//   initial.background  "chart-{이름 색}" — 이름마다 다른 색이라 스펙에 값이 없다(avatar.test.tsx 가 이름 → 색 규칙을 본다)
//   initial.lineHeight  1 — 배율이다. 계산된 줄 높이는 px 라(글자 크기와 같다) 이 값과 견줄 수 없다
//   uploadOverlay.display · uploadOverlay.progress  "none" · "보임" · "Progress Circle 24 · staticWhite …" — 글이다(덮개는 올리는 중에만
//     그려지고, 원은 avatar.test.tsx 가 크기 · 색 · 이름을 본다)
//   editActions.*  사진 바꾸기 버튼 줄은 아바타 밖(아래 16)이라 검사기가 읽는 견본의 첫 요소(원) 안에 들지 않는다 — 간격 16 · 8 · 가운데 ·
//     줄 바꿈 · 버튼 종류(neutralWeak · ghost, small) · 막힘은 avatar.test.tsx 가 AvatarPhotoEdit 의 클래스 · 속성으로 본다.
//     견본(edit=photo)은 원만 Specimen 으로 표시하고, 버튼 줄까지 그린 묶음은 avatar.demo.tsx 가 따로 그린다
//
// 묶음(Avatar Stack)은 같은 폴더의 avatar-stack.measure.mjs 가 잰다(값은 src/shared/ds/spec/avatar-stack.json).
export default {
  "root.radius": ["root", "px", "border-top-left-radius"],
  "root.size": ["root", "px", "width"],
  "image.objectFit": ["[data-slot=avatar-image]", "exact", "object-fit"],
  "initial.foreground": ["[data-slot=avatar-initial]", "color", "color"],
  "initial.fontWeight": ["[data-slot=avatar-initial]", "exact", "font-weight"],
  "initial.textTransform": [
    "[data-slot=avatar-initial]",
    "exact",
    "text-transform",
  ],
  "initial.fontSize": ["[data-slot=avatar-initial]", "px", "font-size"],
  // 올리는 중 덮개 — 원 위 딤(라이트 50% · 다크 65%), 원 모양
  "uploadOverlay.background": [
    "[data-slot=avatar-upload]",
    "color",
    "background-color",
  ],
  "uploadOverlay.radius": [
    "[data-slot=avatar-upload]",
    "px",
    "border-top-left-radius",
  ],
  // 1px 안쪽 테두리는 ::after 의 그림자라 그 두께 · 색을 정하는 원의 변수를 잰다
  "border.borderWidth": ["root", "px", "--avatar-border-width"],
  "border.borderColor": ["root", "color", "--avatar-border-color"],
};
