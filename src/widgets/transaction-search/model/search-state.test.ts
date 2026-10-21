import { describe, expect, it } from "vitest";

import {
  hasAdvanced,
  isIdle,
  toSearchParams,
  type SearchCondition,
} from "./search-state";

const base: SearchCondition = {
  q: "",
  type: "all",
  min: "",
  max: "",
  from: "",
  to: "",
};

describe("거래 검색 조건", () => {
  it("아무 조건도 없으면 찾지 않는다", () => {
    expect(isIdle(base)).toBe(true);
    expect(isIdle({ ...base, q: "  " })).toBe(true);
    expect(isIdle({ ...base, type: "INCOME" })).toBe(false);
  });
  it("서버 인자는 비어 있으면 싣지 않는다", () => {
    expect(toSearchParams({ ...base, q: " 커피 ", min: "1000" })).toEqual({
      keyword: "커피",
      expenseType: undefined,
      minAmount: 1000,
      maxAmount: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  });
  it("고급 필터는 금액 · 기간만 센다", () => {
    expect(hasAdvanced({ ...base, type: "EXPENSE", q: "a" })).toBe(false);
    expect(hasAdvanced({ ...base, from: "2026-10-01" })).toBe(true);
  });
});
