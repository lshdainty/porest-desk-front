import { describe, expect, it } from "vitest";
import type {
  TossHoldings,
  TossHoldingsItem,
} from "@/features/stock/api/stockApi";
import { mergeNamuHoldings } from "@/features/stock/lib/holdings";
import {
  composition,
  directionOfPct,
  namuMarketReps,
  namuHoldingLines,
  namuInvestSummary,
  tossHoldingLines,
  tossInvestSummary,
} from "./invest";

const item = (
  symbol: string,
  amount: string,
  currency: string,
  rate = "10",
): TossHoldingsItem => ({
  symbol,
  name: symbol,
  marketCountry: currency === "USD" ? "US" : "KR",
  currency,
  quantity: "2",
  lastPrice: "1",
  averagePurchasePrice: "1",
  marketValue: { purchaseAmount: "1", amount, amountAfterCost: amount },
  profitLoss: { amount: "5", amountAfterCost: "5", rate, rateAfterCost: rate },
  dailyProfitLoss: { amount: "0", rate: "0" },
  cost: { commission: "0", tax: null },
});

describe("tossInvestSummary", () => {
  it("서버가 센 원화 합계를 그대로 쓴다", () => {
    const h = {
      totalPurchaseAmount: { krw: "100", usd: "0" },
      marketValue: {
        amount: { krw: "150", usd: "0" },
        amountAfterCost: { krw: "150", usd: "0" },
      },
      profitLoss: {
        amount: { krw: "50", usd: "0" },
        amountAfterCost: { krw: "50", usd: "0" },
        rate: "50",
        rateAfterCost: "50",
      },
      dailyProfitLoss: { amount: { krw: "-3", usd: "0" }, rate: "-2.5" },
      items: [item("A", "150", "KRW")],
    } as unknown as TossHoldings;
    expect(tossInvestSummary(h)).toEqual({
      evalAmount: 150,
      purchaseAmount: 100,
      pnl: 50,
      pnlPct: 50,
      dailyPnl: -3,
      dailyPnlPct: -2.5,
      count: 1,
    });
  });
});

describe("tossHoldingLines — Q5-A 원화 환산 정렬", () => {
  it("달러 6,185.55 가 환율로 환산돼 원화 800만 위로 선다", () => {
    const lines = tossHoldingLines(
      [item("K", "8000000", "KRW"), item("U", "6185.55", "USD")],
      1385.2,
    );
    expect(lines.map((l) => l.symbol)).toEqual(["U", "K"]);
    expect(lines[0]!.value).toBe(6185.55); // 표기는 종목 통화 그대로
  });
  it("환율이 없으면 원화 묶음 다음에 외화 묶음", () => {
    const lines = tossHoldingLines(
      [item("U", "6185.55", "USD"), item("K", "1", "KRW")],
      null,
    );
    expect(lines.map((l) => l.symbol)).toEqual(["K", "U"]);
  });
});

describe("composition", () => {
  it("비중은 원화 환산 값으로, 합 100", () => {
    const c = composition(
      tossHoldingLines(
        [item("K", "1000000", "KRW"), item("U", "1000", "USD")],
        1000,
      ),
    );
    expect(c.fxMissing).toBe(false);
    expect(c.items.map((i) => Math.round(i.pct))).toEqual([50, 50]);
  });
  it("환율 없는 외화가 있으면 비중을 내지 않는다", () => {
    const c = composition(tossHoldingLines([item("U", "1000", "USD")], null));
    expect(c).toEqual({ items: [], fxMissing: true });
  });
});

describe("나무", () => {
  const holdings = (currency: "KRW" | "USD") => ({
    accountNo: "1",
    currency,
    totalEvalAmount: "0",
    totalProfitLoss: "0",
    profitRate: "0",
    items: [
      {
        symbol: currency === "KRW" ? "K" : "U",
        name: "n",
        quantity: "1",
        avgPrice: "1",
        currentPrice: "1",
        evalAmount: currency === "KRW" ? "2000" : "3",
        profitLoss: "1",
      },
    ],
  });
  it("섞이면 환산 합계가 있고 보유 줄은 통화를 든다", () => {
    const view = mergeNamuHoldings(
      holdings("KRW") as never,
      holdings("USD") as never,
      1000,
    );
    const s = namuInvestSummary(view);
    expect(s.mixed).toBe(true);
    expect(s.totalKrw).toBe(5000);
    expect(namuHoldingLines(view).map((l) => l.currency)).toEqual([
      "USD",
      "KRW",
    ]);
  });
});

describe("directionOfPct", () => {
  it("0.004% 는 변화 없음", () => {
    expect(directionOfPct(0.004)).toBe("flat");
    expect(directionOfPct(0.01)).toBe("up");
    expect(directionOfPct(-0.2)).toBe("down");
  });
});

describe("나무 시장 대표 종목 (I-13b 17)", () => {
  it("보유 첫 종목 → 없으면 관심 첫 종목 · 시장마다", () => {
    expect(
      namuMarketReps(
        [{ symbol: "A", currency: "KRW" }],
        [
          { symbol: "K2", countryCode: "KR" },
          { symbol: "U1", countryCode: "US" },
        ],
      ),
    ).toEqual({ kr: "A", us: "U1" });
    expect(namuMarketReps([], [])).toEqual({ kr: null, us: null });
  });
});
