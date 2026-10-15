// 전역 스크롤바 한 벌(Scroll Area 스펙) — src/index.css 의 글을 본다.
// 스크롤바 6px · 알약 · stroke-neutral-solid 는 ::-webkit-scrollbar 가상 요소 · @supports 안의 규칙이라 ds:check(getComputedStyle)가
// 읽지 못한다. 만든 날 크로미움(playwright)에서 카탈로그의 상자를 띄워 offsetWidth − clientWidth = 6 을 쟀고, 이 테스트는 그 규칙이
// index.css 에 그대로 있는지, Firefox 두 줄이 @supports 밖으로 새지 않는지(크로미움이 webkit 6px 을 버리고 10 · 15px 로 그린다) 글로 지킨다.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const indexCss = readFileSync("src/index.css", "utf-8");

describe("전역 스크롤바 — src/index.css 한 벌", () => {
  it("크로미움 · 사파리 — 세로 · 가로 6px(w-1.5 · h-1.5), 막대는 stroke-neutral-solid 알약, 바탕 투명", () => {
    expect(indexCss).toMatch(
      /::-webkit-scrollbar\s*\{\s*@apply w-1\.5 h-1\.5;/,
    );
    expect(indexCss).toMatch(
      /::-webkit-scrollbar-track\s*\{\s*background:\s*transparent;/,
    );
    expect(indexCss).toMatch(
      /::-webkit-scrollbar-thumb\s*\{\s*background:\s*var\(--color-stroke-neutral-solid\);\s*border-radius:\s*var\(--radius-full\);/,
    );
    // 올려도 모양이 바뀌지 않는다
    expect(indexCss).not.toMatch(/::-webkit-scrollbar-thumb:hover/);
  });

  it("Firefox 의 scrollbar-width · scrollbar-color 는 @supports not selector(::-webkit-scrollbar) 안에만 둔다", () => {
    const block = indexCss.match(
      /@supports not selector\(::-webkit-scrollbar\)\s*\{[\s\S]*?\n {2}\}/,
    );
    expect(block).not.toBeNull();
    expect(block![0]).toContain("scrollbar-width: thin;");
    expect(block![0]).toContain(
      "scrollbar-color: var(--color-stroke-neutral-solid) transparent;",
    );
    // 블록 밖에서는 .scrollbar-hide 의 none 말고 scrollbar-width · scrollbar-color 를 쓰지 않는다
    const outside = indexCss.replace(block![0], "");
    const uses = outside.match(/scrollbar-(width|color):\s*[^;]+;/g) ?? [];
    expect(uses).toEqual(["scrollbar-width: none;"]);
  });

  it("세로 스크롤바를 숨기는 규칙은 .scrollbar-hide 하나뿐이다(가로 줄에만 쓴다)", () => {
    expect(indexCss).toMatch(
      /\.scrollbar-hide::-webkit-scrollbar\s*\{\s*display:\s*none;/,
    );
  });
});
