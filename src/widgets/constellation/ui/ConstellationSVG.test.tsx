// 별자리를 그리는 식 — 앱 `ConstellationPainter`(uniformScale)와 같은 독립 공식의 기대값(star-geometry.fixture.json)으로 잠근다.
// scale = min(W, H) / 100 · 중앙 정렬 offset · 허용 0.5px. 별 크기 · 선 굵기는 size 비율.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import geometry from "../lib/star-geometry.fixture.json";
import maps from "../lib/star-map.fixture.json";
import { ConstellationSVG } from "./ConstellationSVG";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const byKey = new Map(maps.constellations.map((c) => [c.key, c]));

describe("ConstellationSVG 기하(웹 ↔ 앱 같은 식)", () => {
  it("fixture 케이스가 있다", () => {
    expect(geometry.cases.length).toBeGreaterThanOrEqual(20);
    expect(byKey.get("cen")?.star_map.pts).toHaveLength(16);
  });

  it.each(geometry.cases)(
    "$key · $panel($w × $h) 별 중심 · 선 끝점",
    ({ key, w, h, offset, scale, centers, lines }) => {
      const info = byKey.get(key)!;
      const size = Math.min(w, h);
      act(() =>
        root.render(
          <ConstellationSVG
            starMap={JSON.stringify(info.star_map)}
            size={size}
          />,
        ),
      );
      const svg = container.querySelector("svg")!;
      expect(svg.getAttribute("viewBox")).toBe("0 0 100 100");
      // 정사각 svg 를 패널 가운데에 둔다 → 패널 안 좌표 = (패널 − size) / 2 + viewBox 좌표 × size / 100
      const px = (w - size) / 2;
      const py = (h - size) / 2;
      const k = size / 100;
      expect(k).toBeCloseTo(scale, 5);
      expect(px).toBeCloseTo(offset[0]!, 3);
      expect(py).toBeCloseTo(offset[1]!, 3);
      const circles = [...svg.querySelectorAll("circle")];
      expect(circles).toHaveLength(centers.length);
      circles.forEach((c, i) => {
        const x = px + Number(c.getAttribute("cx")) * k;
        const y = py + Number(c.getAttribute("cy")) * k;
        expect(Math.abs(x - centers[i]![0]!)).toBeLessThanOrEqual(0.5);
        expect(Math.abs(y - centers[i]![1]!)).toBeLessThanOrEqual(0.5);
      });
      const ls = [...svg.querySelectorAll("line")];
      expect(ls).toHaveLength(lines.length);
      ls.forEach((l, i) => {
        const got = [
          px + Number(l.getAttribute("x1")) * k,
          py + Number(l.getAttribute("y1")) * k,
          px + Number(l.getAttribute("x2")) * k,
          py + Number(l.getAttribute("y2")) * k,
        ];
        got.forEach((v, j) =>
          expect(Math.abs(v - lines[i]![j]!)).toBeLessThanOrEqual(0.5),
        );
      });
    },
  );

  it("별 크기 · 선 굵기는 별 수 구간 비율(앱과 같은 표)", () => {
    const cases: [string, number, number, number][] = [
      ["dipper", 0.022, 0.034, 0.026],
      ["cen", 0.012, 0.018, 0.015],
    ];
    // cen 은 16별 → 구간 "그 밖"(≤ 15 아님)
    for (const [key, line, rLit, rUnlit] of cases) {
      const info = byKey.get(key)!;
      act(() =>
        root.render(
          <ConstellationSVG
            starMap={JSON.stringify(info.star_map)}
            size={100}
          />,
        ),
      );
      const l = container.querySelector("line");
      expect(Number(l?.getAttribute("stroke-width")) / 100).toBeCloseTo(
        line,
        4,
      );
      const on = container.querySelector("circle");
      expect(Number(on?.getAttribute("r")) / 100).toBeCloseTo(rLit, 4);
      act(() =>
        root.render(
          <ConstellationSVG
            starMap={JSON.stringify(info.star_map)}
            size={100}
            lit={1}
          />,
        ),
      );
      const off = container.querySelector("circle[fill=none]");
      expect(Number(off?.getAttribute("r")) / 100).toBeCloseTo(rUnlit, 4);
      // 꺼진 별 테두리 = 짧은 변 × 0.014 — viewBox 비례라 size 가 달라도 같은 비(앱 painter 와 같다)
      expect(Number(off?.getAttribute("stroke-width")) / 100).toBeCloseTo(
        geometry.sizeRatios.unlitStroke,
        4,
      );
    }
  });

  it("glow 는 그림 상자 밖으로 번져도 자르지 않는다(앱 캔버스와 같다 — 도감 줄 타일 30 + glow)", () => {
    const info = byKey.get("dipper")!;
    act(() =>
      root.render(
        <ConstellationSVG
          starMap={JSON.stringify(info.star_map)}
          size={30}
          glow
        />,
      ),
    );
    const svg = container.querySelector("svg")!;
    expect(svg.style.overflow).toBe("visible");
    // 켄 별마다 글로우 원(r × 2, 블러 6px = viewBox 20 단위)
    const glows = [...svg.querySelectorAll("circle[filter]")];
    expect(glows).toHaveLength(info.star_map.pts.length);
    expect(
      svg.querySelector("feGaussianBlur")?.getAttribute("stdDeviation"),
    ).toBe(String((6 * 100) / 30));
  });
});
