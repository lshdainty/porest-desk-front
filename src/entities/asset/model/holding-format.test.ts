import { describe, it, expect } from "vitest";
import { formatQty } from "./holding-format";

describe("formatQty 음수 부호 (I-31)", () => {
  it("음수 수량은 U+2212 로 낸다", () => {
    expect(formatQty("-1234.5")).toBe("\u22121,234.5");
    expect(formatQty("-3")).not.toContain("-");
  });
  it("양수·0 은 그대로", () => {
    expect(formatQty("1234.5")).toBe("1,234.5");
    expect(formatQty("0")).toBe("0");
  });
});
