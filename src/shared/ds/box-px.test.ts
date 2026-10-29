// ds 부품 전체의 상자 · 아이콘 · 원은 px 다(I-29 P9 · DESIGN.md:2441 "단위 규칙은 글자에만") — 글자 200% 에서 두 배가 되지 않는다.
// frame-px.test.ts 가 틀 부품 열세 파일을 지키고, 이 시험이 ds 전 폴더의 소스(데모 · 시험 · 카탈로그 제외)를 지킨다.
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SKIP = /\.(test|demo|measure)\.|(^|\/)(catalog|spec)\//;
const REM_SIZE =
  /(?<![\w-])(?:[\w[\]&>_=@()/-]+:)*(?:size|h|w|min-h|min-w|max-h|max-w)-(?!0(?![.\d]))\d+(?:\.\d+)?(?![\w[\]/.-])/g;

// 임의값 rem — w-[2.375rem] · size-[1.625rem] · min-h-[5.875rem] 처럼 상자 크기를 rem 으로 적은 것(글줄 기준 calc 안의 1rem 은 제외)
const REM_ARBITRARY =
  /(?<![\w-])(?:[\w[\]&>_=@()/-]+:)*(?:size|w|h|min-w|min-h|max-w|max-h)-\[\d+(?:\.\d+)?rem\]/g;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name) && !SKIP.test(p)) out.push(p);
  }
  return out;
}

const strip = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

describe("ds 상자 · 아이콘 크기는 px 다", () => {
  it("Tailwind 숫자 크기(rem)가 남아 있지 않다", () => {
    const bad: string[] = [];
    for (const f of walk(__dirname)) {
      if (f === __filename) continue;
      for (const m of strip(readFileSync(f, "utf8")).matchAll(REM_SIZE)) {
        bad.push(`${path.relative(__dirname, f)}: ${m[0]}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("상자 크기를 rem 임의값으로 적은 곳이 없다", () => {
    const bad: string[] = [];
    for (const f of walk(__dirname)) {
      if (f === __filename) continue;
      for (const m of strip(readFileSync(f, "utf8")).matchAll(REM_ARBITRARY)) {
        bad.push(`${path.relative(__dirname, f)}: ${m[0]}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
