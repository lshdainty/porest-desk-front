// 차트 색 짝 변수는 늘 내보낸다(I-29 P5) — chart-palette.ts 가 `var(${cssVar}-contrast)` 처럼 이름을
// 템플릿 문자열로 만들어 Tailwind 가 쓰는 곳을 못 찾는다. 기본 @theme 로만 두면 안 쓴 변수가 운영 CSS 에서
// 빠져 칩 · 배지 글이 기본 글색으로 떨어진다. index.css 의 `@theme static` 에 열 색 × 셋이 모두 있는지 본다.
// (운영 빌드 CSS 의 실제 내보냄은 vite build 후 grep 으로 확인한다 — 결과표 P5.)
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(path.join(__dirname, "..", "src/index.css"), "utf8");
const palette = readFileSync(
  path.join(__dirname, "..", "src/shared/lib/groo/chart-palette.ts"),
  "utf8",
);
const staticBlock = css.slice(css.indexOf("@theme static {"));

const HUES = [
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "indigo",
  "violet",
  "pink",
  "brown",
  "gray",
];

describe("차트 색 짝 변수 항상 내보내기", () => {
  it("팔레트 열 색이 모두 chart-palette.ts 에 있다", () => {
    for (const h of HUES) expect(palette).toContain(`"--color-chart-${h}"`);
  });

  it.each(HUES)(
    "%s 의 weak · subtle · contrast 가 @theme static 에 있다",
    (h) => {
      for (const s of ["weak", "subtle", "contrast"]) {
        expect(staticBlock).toContain(`--color-chart-${h}-${s}:`);
      }
    },
  );
});
