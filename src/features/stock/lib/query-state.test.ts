import { describe, expect, it } from "vitest";

import { isHardError } from "./query-state";

describe("isHardError — 값이 하나도 없을 때만 실패 화면", () => {
  it("실패 + 값 없음 → 실패", () => {
    expect(isHardError({ isError: true, data: undefined })).toBe(true);
  });
  it("실패 + 받아 둔 값 있음(폴링 한 번 실패) → 실패 아님", () => {
    expect(isHardError({ isError: true, data: { a: 1 } })).toBe(false);
  });
  it("빈 목록 · 0 · null 도 '받아 둔 값' 이다", () => {
    expect(isHardError({ isError: true, data: [] })).toBe(false);
    expect(isHardError({ isError: true, data: 0 })).toBe(false);
    expect(isHardError({ isError: true, data: null })).toBe(false);
  });
  it("성공 → 실패 아님", () => {
    expect(isHardError({ isError: false, data: undefined })).toBe(false);
  });
});
