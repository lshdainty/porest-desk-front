import { describe, it, expect } from "vitest";
import { measureTickWidth } from "./axisWidth";

describe("measureTickWidth (D6)", () => {
  it("가장 긴 눈금 글자에 맞춘다 — 음수 부호가 붙은 쪽이 더 넓다", () => {
    const pos = measureTickWidth(["0", "2,500만"]);
    const neg = measureTickWidth(["0", "−2,500만"]);
    expect(neg).toBeGreaterThan(pos);
  });
  it("눈금이 늘어도 가장 긴 하나가 폭을 정한다", () => {
    const one = measureTickWidth(["−3,000만"]);
    expect(measureTickWidth(["0", "−1억", "−3,000만"])).toBe(one);
  });
});
