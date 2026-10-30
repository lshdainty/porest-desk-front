import { describe, expect, it } from "vitest";

import { clock12 } from "./market-state";

describe("clock12 — 시각은 오전 · 오후 12시간", () => {
  it("한국어: 13:00 → 오후 1:00", () => {
    expect(clock12("13:00")).toBe("오후 1:00");
    expect(clock12("22:30")).toBe("오후 10:30");
  });
  it("정오 · 자정", () => {
    expect(clock12("12:00")).toBe("오후 12:00");
    expect(clock12("00:00")).toBe("오전 12:00");
  });
  it("초가 있으면 분 뒤에 붙는다", () => {
    expect(clock12("13:00:05")).toBe("오후 1:00:05");
  });
  it("읽지 못하면 그대로", () => {
    expect(clock12("장마감")).toBe("장마감");
  });
});
