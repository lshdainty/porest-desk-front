// 틀 부품의 상자 · 아이콘 · 원은 px 다 — 글자 배율(루트 글자 크기)을 따르지 않는다(03-G 결정 1A, 레시피 #183).
// Tailwind 숫자 크기(size-11 = 2.75rem)가 남아 있으면 글자 200% 에서 상단 바 112 · 하단 바 + 원 88 이 된다.
// 클래스는 cva 안에 있어 값으로 모으기 어렵다 — 소스 글을 읽어 주석을 걷고 본다.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const FILES = [
  "top-navigation/top-navigation-variants.ts",
  "top-navigation/top-navigation.tsx",
  "bottom-navigation/bottom-navigation-variants.ts",
  "bottom-navigation/bottom-navigation.tsx",
  "floating-action-button/floating-action-button-variants.ts",
  "floating-action-button/floating-action-button.tsx",
  "side-navigation/side-navigation-variants.ts",
  "side-navigation/side-navigation.tsx",
  "side-navigation/side-navigation-item.tsx",
  "tabs/tabs-variants.ts",
  "tabs/tabs.tsx",
];

const source = (file: string) =>
  readFileSync(path.join(__dirname, file), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");

// 숫자 한 자리로 크기를 정하는 유틸리티 — size-11 · h-14 · min-h-10 · [&_svg]:size-6 · before:size-11. 0(min-w-0 · min-h-0) · px · full · 분수 아닌 것은 제외
const REM_SIZE =
  /(?<![\w-])(?:[\w[\]&>_=-]+:)*(?:size|h|w|min-h|min-w|max-h|max-w)-(?!0(?![.\d]))\d+(?:\.\d+)?(?![\w[\]/.-])/g;
// 레시피가 그대로 rem 으로 둔 것 — 탭 아래 막대 두께 2px(h-0.5)
const ALLOWED = new Set(["h-0.5"]);

describe("틀 부품 — 크기 클래스는 px 다(루트 글자 크기를 따르지 않는다)", () => {
  it("Tailwind 숫자 크기(rem)가 남아 있지 않다", () => {
    const bad: string[] = [];
    for (const file of FILES) {
      for (const m of source(file).matchAll(REM_SIZE)) {
        if (ALLOWED.has(m[0].split(":").pop()!)) continue;
        bad.push(`${file}: ${m[0]}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("레시피 값이 px 로 들어 있다 — 상단 바 56 · 아이콘 버튼 44 · FAB 56 · 사이드 접기 40", () => {
    const top = source("top-navigation/top-navigation-variants.ts");
    expect(top).toContain("h-[56px]");
    expect(top).toContain("size-[44px]");
    expect(top).toContain("[&_svg]:size-[24px]");
    const bottom = source("bottom-navigation/bottom-navigation-variants.ts");
    expect(bottom).toContain("h-[48px]");
    expect(bottom).toContain(
      "size-[44px] [--add-basis:44] [&_svg]:size-[24px]",
    );
    expect(bottom).toContain(
      "size-[36px] [--add-basis:36] [&_svg]:size-[20px]",
    );
    expect(
      source("floating-action-button/floating-action-button-variants.ts"),
    ).toContain("size-[56px]");
    const side = source("side-navigation/side-navigation-variants.ts");
    expect(side).toContain("size-[40px]");
    expect(side).toContain("before:size-[44px]");
  });

  it("검사기가 rem 크기를 실제로 잡는다", () => {
    expect(
      "flex size-11 h-14 [&_svg]:size-6 before:size-11".match(REM_SIZE),
    ).toHaveLength(4);
    expect(
      "min-w-0 min-h-0 size-[44px] h-px w-full".match(REM_SIZE),
    ).toBeNull();
  });
});
