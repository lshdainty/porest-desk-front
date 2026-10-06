// Divider 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 재지 않는 값
//   root.width · root.height  "100%" · "부모 높이" — 문장(쓰는 자리의 폭 · 높이를 따른다)
//   세로선의 두께              두께는 가로선의 높이로 잰다. 세로선은 폭이 두께인데 한 값을 두 속성으로 잴 수 없어 건너뛴다
//                              (스펙에 root.height 가 있는 조합 — divider.test.tsx 가 w-px 를 본다)
export default {
  "root.thickness": ["root", "px", "height", { skipIf: "root.height" }],
  "root.background": ["root", "color", "background-color"],
  // 바깥 여백 0 — 위 여백으로 잰다. 세로선 들임은 위아래 16(root.marginY)이 그 자리를 덮는다
  "root.margin": ["root", "px", "margin-top", { skipIf: "root.marginY" }],
  "root.marginX": ["root", "px", "margin-left"],
  "root.marginY": ["root", "px", "margin-top"],
};
