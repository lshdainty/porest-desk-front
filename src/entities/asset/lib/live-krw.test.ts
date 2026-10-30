// 라이브 평가(원화)를 외화 투자 자산에 얹을 때 환율을 두 번 곱하지 않는다 — 돈 결함(I-17-2 검수 M8).
import { describe, expect, it } from "vitest";
import { assetBalanceInKrw } from "@/shared/lib/groo/currency";
import type { Asset } from "../model/types";
import { holdingBalanceInKrw, withLiveValuation } from "./live-krw";

const asset = (over: Partial<Asset>): Asset =>
  ({
    rowId: 1,
    assetName: "해외 증권계좌",
    assetType: "INVESTMENT",
    balance: 8_000,
    cashBalance: 100,
    holdingBalance: 7_900,
    currency: "USD",
    exchangeRate: 1_300,
    isIncludedInTotal: "Y",
    ...over,
  }) as Asset;

describe("withLiveValuation", () => {
  it("외화 투자: 원화 라이브 평가 10,000,000 + 예수금 $100 → 줄 · 합계 = 10,130,000 (13,000,000,000 이 아니다)", () => {
    const live = withLiveValuation(asset({}), 10_000_000);
    expect(assetBalanceInKrw(live)).toBe(10_000_000 + 100 * 1_300);
    expect(live.currency).toBe("KRW");
    expect(live.exchangeRate).toBe(1);
    expect(live.holdingBalance).toBe(10_000_000);
  });

  it("원화 투자: 예수금 + 라이브 평가 그대로(통화 · 환율을 건드리지 않는다)", () => {
    const krw = asset({
      currency: "KRW",
      exchangeRate: 1,
      cashBalance: 50_000,
    });
    const live = withLiveValuation(krw, 1_000_000);
    expect(live.balance).toBe(1_050_000);
    expect(live.currency).toBe("KRW");
    expect(assetBalanceInKrw(live)).toBe(1_050_000);
  });

  it("환율이 없는 외화 자산은 krwOf 가 곱하지 않으므로 통화를 그대로 두고 원화 값으로 얹는다", () => {
    const live = withLiveValuation(asset({ exchangeRate: 1 }), 500_000);
    expect(live.currency).toBe("USD");
    expect(assetBalanceInKrw(live)).toBe(100 + 500_000);
  });

  it("예수금이 0 이면 평가금액만", () => {
    const live = withLiveValuation(asset({ cashBalance: 0 }), 2_000_000);
    expect(assetBalanceInKrw(live)).toBe(2_000_000);
  });
});

describe("자산 화면 합계 경로", () => {
  it("외화 투자 1건 + 원화 계좌 1건 — 투자 합계 · 순자산 보정이 한 번만 환산된다", () => {
    const usd = asset({
      holdingBalance: 7_900,
      cashBalance: 100,
      balance: 8_000,
    });
    const won = asset({
      rowId: 2,
      assetType: "BANK_ACCOUNT",
      currency: "KRW",
      exchangeRate: 1,
      balance: 1_000_000,
      cashBalance: 0,
      holdingBalance: 0,
    });
    const liveKrw = 10_000_000;
    const list = [withLiveValuation(usd, liveKrw), won];
    const total = list
      .filter((a) => a.isIncludedInTotal === "Y")
      .reduce((s, a) => s + assetBalanceInKrw(a), 0);
    expect(total).toBe(10_130_000 + 1_000_000);
    // 순자산 보정 = 라이브 − DB 보유분(둘 다 원화): 10,000,000 − 7,900 × 1,300
    expect(liveKrw - holdingBalanceInKrw(usd)).toBe(10_000_000 - 10_270_000);
  });
});

describe("holdingBalanceInKrw", () => {
  it("외화 보유분은 환율을 곱한 원화, 원화는 그대로(라이브 − DB 보정이 같은 단위로 빼도록)", () => {
    expect(holdingBalanceInKrw(asset({ holdingBalance: 7_900 }))).toBe(
      7_900 * 1_300,
    );
    expect(
      holdingBalanceInKrw(
        asset({
          currency: "KRW",
          exchangeRate: 1,
          holdingBalance: 7_900,
        }),
      ),
    ).toBe(7_900);
    expect(holdingBalanceInKrw(asset({ holdingBalance: 0 }))).toBe(0);
  });
});
