#!/usr/bin/env node
/**
 * CDN Pretendard v1.3.9 dynamic-subset 의 unicode-range 에 빠진 기호(− ✓ ⚠ ∅ ↺ ⌘)를
 * Pretendard 원본(앱 번들 PretendardVariable.ttf, Version 1.309)에서 뽑아 public/fonts 에 만든다.
 * wght 축(45–930)은 그대로 둔다. 라이선스: public/fonts/Pretendard-OFL.txt (SIL OFL 1.1).
 *
 * 실행: node scripts/build-font-supplement.mjs <PretendardVariable.ttf> (subset-font 이 설치된 곳에서)
 * 글리프를 바꾸면 src/index.css 의 unicode-range 도 같이 고친다.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(
  process.env.SUBSET_FONT_DIR
    ? `${process.env.SUBSET_FONT_DIR}/`
    : import.meta.url,
);
const subsetFont = require("subset-font");
const TEXT = "−✓⚠∅↺⌘";
const [src] = process.argv.slice(2);
if (!src)
  throw new Error("usage: build-font-supplement.mjs <PretendardVariable.ttf>");
const out = await subsetFont(readFileSync(src), TEXT, {
  targetFormat: "woff2",
});
writeFileSync(
  new URL("../public/fonts/pretendard-supplement.woff2", import.meta.url),
  out,
);
console.log("pretendard-supplement.woff2", out.length, "bytes");
