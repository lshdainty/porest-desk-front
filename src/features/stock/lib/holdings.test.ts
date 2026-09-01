/**
 * 통화 합침과 환율 실패 처리를 고정한다.
 *
 * 레이아웃은 테스트로 잡기 어렵지만 **데이터 축은 잡을 수 있다.** 여기서 지키는 건 하나 —
 * 통화가 섞였는데 환율이 없을 때 **부분합을 총액이라고 부르지 않는다**.
 */
import { describe, expect, it } from "vitest";
import { donutSlices, krwValueOf, mergeNamuHoldings } from "./holdings";
import type { NamuHoldings } from "../api/namuApi";

const item = (
  symbol: string,
  evalAmount: string,
  profitLoss = "0",
  name = symbol,
) => ({
  symbol,
  name,
  quantity: "1",
  avgPrice: "0",
  currentPrice: evalAmount,
  evalAmount,
  profitLoss,
});

const holdings = (
  currency: string,
  items: ReturnType<typeof item>[],
): NamuHoldings => ({
  accountNo: "33333333301",
  currency,
  totalEvalAmount: String(items.reduce((s, i) => s + Number(i.evalAmount), 0)),
  totalProfitLoss: "0",
  profitRate: "0",
  items,
});

const KRW_ONE = holdings("KRW", [
  item("005930", "10000000", "1000000", "삼성전자"),
]);
const USD_ONE = holdings("USD", [item("AAPL", "5000", "500", "Apple")]);

describe("mergeNamuHoldings", () => {
  it("국내·해외를 한 목록으로 붙이고 행마다 통화를 남긴다", () => {
    const v = mergeNamuHoldings(KRW_ONE, USD_ONE, 1383.5);

    expect(v.count).toBe(2);
    expect(v.rows.map((r) => r.currency).sort()).toEqual(["KRW", "USD"]);
    expect(v.krw?.evalAmount).toBe(10_000_000);
    expect(v.usd?.evalAmount).toBe(5000);
  });

  it("통화별 합계는 자기 통화 기준이라 환율이 없어도 정확하다", () => {
    const v = mergeNamuHoldings(KRW_ONE, USD_ONE, null);

    expect(v.krw?.evalAmount).toBe(10_000_000);
    expect(v.usd?.evalAmount).toBe(5000);
    // 합계만 못 낸다.
    expect(v.totalKrw).toBeNull();
    expect(v.fxMissing).toBe(true);
  });

  it("환율이 있으면 원화로 환산해 총액을 낸다", () => {
    const v = mergeNamuHoldings(KRW_ONE, USD_ONE, 1000);

    expect(v.totalKrw).toBe(10_000_000 + 5000 * 1000);
    expect(v.appliedFxRate).toBe(1000);
    expect(v.fxMissing).toBe(false);
  });

  it("해외 보유가 없으면 환율 없이도 총액을 낸다 — 환산할 게 없다", () => {
    const v = mergeNamuHoldings(KRW_ONE, undefined, null);

    expect(v.totalKrw).toBe(10_000_000);
    expect(v.fxMissing).toBe(false);
    expect(v.usd).toBeNull();
  });

  it("국내 보유가 없고 해외만 있어도 환율이 있으면 총액을 낸다", () => {
    const v = mergeNamuHoldings(undefined, USD_ONE, 1400);

    expect(v.krw).toBeNull();
    expect(v.totalKrw).toBe(5000 * 1400);
  });

  it("해외만 있는데 환율이 없으면 총액은 null — 0원으로 접지 않는다", () => {
    const v = mergeNamuHoldings(undefined, USD_ONE, null);

    expect(v.totalKrw).toBeNull();
    expect(v.fxMissing).toBe(true);
  });

  it.each([
    ["0", 0],
    ["음수", -5],
    ["NaN", Number.NaN],
    ["무한대", Number.POSITIVE_INFINITY],
  ])("환율이 %s 면 없는 것으로 본다", (_label, rate) => {
    const v = mergeNamuHoldings(KRW_ONE, USD_ONE, rate);

    expect(v.totalKrw).toBeNull();
    expect(v.appliedFxRate).toBeNull();
    expect(v.fxMissing).toBe(true);
  });

  it('조회가 실패한 통화는 합계가 null — "0원 보유" 와 구분한다', () => {
    const v = mergeNamuHoldings(undefined, undefined, 1383.5);

    expect(v.krw).toBeNull();
    expect(v.usd).toBeNull();
    expect(v.count).toBe(0);
    expect(v.totalKrw).toBeNull();
  });

  it("보유가 0건인 응답도 합계가 null — 빈 배열로 왔다고 0원이라 하지 않는다", () => {
    const v = mergeNamuHoldings(holdings("KRW", []), undefined, null);

    expect(v.krw).toBeNull();
    expect(v.count).toBe(0);
  });

  it("수익률은 매입금액 기준으로 낸다", () => {
    // 평가 11,000 · 손익 1,000 → 매입 10,000 → +10%
    const v = mergeNamuHoldings(
      holdings("KRW", [item("A", "11000", "1000")]),
      undefined,
      null,
    );

    expect(v.krw?.profitRatePct).toBeCloseTo(10, 6);
  });

  it("매입금액이 0이면 수익률은 0 — 0으로 나누지 않는다", () => {
    const v = mergeNamuHoldings(
      holdings("KRW", [item("A", "1000", "1000")]),
      undefined,
      null,
    );

    expect(v.krw?.profitRatePct).toBe(0);
  });
});

describe("정렬", () => {
  it("환율이 있으면 원화 환산 기준으로 통화를 섞어 정렬한다", () => {
    // 달러 100 × 1400 = 140,000원 > 원화 50,000
    const v = mergeNamuHoldings(
      holdings("KRW", [item("KR1", "50000")]),
      holdings("USD", [item("US1", "100")]),
      1400,
    );

    expect(v.rows.map((r) => r.symbol)).toEqual(["US1", "KR1"]);
  });

  it("환율이 없으면 국내 묶음 → 해외 묶음 순으로 두고 각 묶음 안에서만 정렬한다", () => {
    // 척도가 없으니 통화를 가로질러 비교하지 않는다 — 그건 정렬이 아니라 거짓말이다.
    const v = mergeNamuHoldings(
      holdings("KRW", [item("KR_SMALL", "10000"), item("KR_BIG", "90000")]),
      holdings("USD", [item("US_SMALL", "10"), item("US_BIG", "900")]),
      null,
    );

    expect(v.rows.map((r) => r.symbol)).toEqual([
      "KR_BIG",
      "KR_SMALL",
      "US_BIG",
      "US_SMALL",
    ]);
  });
});

describe("krwValueOf", () => {
  it("원화 행은 그대로", () => {
    expect(krwValueOf({ ...item("A", "1000"), currency: "KRW" }, 1400)).toBe(
      1000,
    );
  });

  it("달러 행은 환율을 곱한다", () => {
    expect(krwValueOf({ ...item("A", "10"), currency: "USD" }, 1400)).toBe(
      14_000,
    );
  });

  it("환율이 없으면 달러 행은 0 — 비교 척도에서 뺀다", () => {
    expect(krwValueOf({ ...item("A", "10"), currency: "USD" }, null)).toBe(0);
  });
});

describe("donutSlices", () => {
  it("환율이 있으면 원화 환산 비중을 낸다", () => {
    const v = mergeNamuHoldings(
      holdings("KRW", [item("KR1", "50000", "0", "국내주")]),
      holdings("USD", [item("US1", "100", "0", "해외주")]),
      1400,
    );

    expect(donutSlices(v)).toEqual([
      { name: "해외주", value: 140_000 },
      { name: "국내주", value: 50_000 },
    ]);
  });

  it("통화가 섞였는데 환율이 없으면 조각을 안 낸다 — 거짓 비중을 그리지 않는다", () => {
    const v = mergeNamuHoldings(KRW_ONE, USD_ONE, null);

    expect(donutSlices(v)).toEqual([]);
  });

  it("원화만 있으면 환율 없이도 비중을 낸다", () => {
    const v = mergeNamuHoldings(KRW_ONE, undefined, null);

    expect(donutSlices(v)).toHaveLength(1);
    expect(donutSlices(v)[0]!.value).toBe(10_000_000);
  });
});
