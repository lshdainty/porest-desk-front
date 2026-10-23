// 나무 부품은 로고 원본(groo_logo.svg)의 path 를 그대로 옮긴 것이다 — 다시 그리지 않는다(I-05 L).
import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GrooTree } from "./groo-tree";

const original = readFileSync(
  path.join(__dirname, "../../assets/img/groo_logo.svg"),
  "utf8",
);
const dOf = (svg: string) =>
  [...svg.matchAll(/<path[^>]*?\sd="([^"]+)"/g)].map((m) =>
    (m[1] ?? "").replace(/\s+/g, ""),
  );
const fillOf = (svg: string) =>
  [...svg.matchAll(/<path[^>]*?\sfill="([^"]+)"/g)].map((m) => m[1]);

describe("GrooTree", () => {
  it("path · 칠이 groo_logo.svg 와 같고 같은 차례다", () => {
    const html = renderToStaticMarkup(<GrooTree />);
    expect(dOf(html)).toEqual(dOf(original));
    expect(dOf(html)).toHaveLength(4);
    expect(fillOf(html)).toEqual(["#A96D57", "#075B3C", "#43BF5E", "#218D49"]);
  });

  it("보기 상자 147 183 154 166 · 높이 = size · 폭은 154:166", () => {
    const html = renderToStaticMarkup(<GrooTree size={56} />);
    expect(html).toContain('viewBox="147 183 154 166"');
    expect(html).toContain('height="56"');
    expect(Number(/width="([\d.]+)"/.exec(html)![1])).toBeCloseTo(51.95, 2);
  });

  it("장식이다 — 화면 낭독에서 빠진다", () => {
    expect(renderToStaticMarkup(<GrooTree />)).toContain('aria-hidden="true"');
  });
});
