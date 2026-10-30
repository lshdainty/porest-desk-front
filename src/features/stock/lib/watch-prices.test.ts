import { describe, expect, it } from "vitest";
import type { WatchGroup } from "../api/stockApi";
import { chunkSymbols, visibleSymbols } from "./watch-prices";

const group = (rowId: number, symbols: string[]): WatchGroup => ({
  rowId,
  groupName: `g${rowId}`,
  sortOrder: rowId,
  items: symbols.map((symbol, i) => ({
    rowId: rowId * 100 + i,
    symbol,
    marketCode: "KOSPI",
    nameKr: symbol,
    countryCode: "KR",
    currency: "KRW",
  })) as WatchGroup["items"],
});

describe("관심 그룹 시세 심볼", () => {
  it("보이는 그룹만 합치고 겹침을 빼고 정렬한다", () => {
    const gs = [group(1, ["B", "A"]), group(2, ["A", "C"]), group(3, ["Z"])];
    expect(visibleSymbols(gs, new Set([1, 2]))).toEqual(["A", "B", "C"]);
    expect(visibleSymbols(gs, new Set())).toEqual([]);
  });
  it("50 을 넘으면 50 씩 나눈다", () => {
    const syms = Array.from({ length: 120 }, (_, i) => `S${i}`);
    expect(chunkSymbols(syms).map((c) => c.length)).toEqual([50, 50, 20]);
    expect(chunkSymbols([])).toEqual([]);
  });
});
