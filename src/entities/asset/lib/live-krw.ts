import {
  assetBalanceInKrw,
  isForeignCurrency,
} from "@/shared/lib/groo/currency";
import type { Asset } from "../model/types";

/*
 * 라이브 평가는 **원화**다(`useInvestValuation` 이 시세를 `unitKrw` 로 바꿔 더한다). 그런데 자산의 잔액은 그 자산의 통화이고,
 * 줄 · 합계는 `krwOf` 가 환율을 곱해 원화로 만든다 — 라이브 평가를 외화 자산의 `balance` 에 그대로 얹으면 환율이 두 번 곱해진다
 * (USD 투자계좌 · 환율 1,300 · 평가 10,000,000원 → 줄 13,000,000,000원). 그래서 외화 자산에 라이브 평가를 얹을 때는
 * 잔액을 원화로 바꾸고 통화를 KRW 로 둔다.
 */

/** 환율이 있는 외화 자산인가 — `assetBalanceInKrw` 가 곱하는 경우와 같은 조건 */
const hasRate = (a: Pick<Asset, "currency" | "exchangeRate">): boolean =>
  isForeignCurrency(a.currency) && a.exchangeRate != null && a.exchangeRate > 0;

/** 원화 환산한 보유분(`holdingBalance`) — 라이브 평가(원화)와 비교할 때 쓴다 */
export const holdingBalanceInKrw = (
  a: Pick<Asset, "holdingBalance" | "currency" | "exchangeRate">,
): number =>
  assetBalanceInKrw({
    balance: a.holdingBalance ?? 0,
    currency: a.currency,
    exchangeRate: a.exchangeRate,
  });

/**
 * 라이브 평가(원화, 보유분만)를 얹은 자산 — `balance` = 예수금 + 평가금액.
 * 환율이 있는 외화 자산은 예수금도 원화로 바꿔 더하고 통화를 KRW 로 둔다(위 설명).
 */
export function withLiveValuation(asset: Asset, liveKrw: number): Asset {
  if (!hasRate(asset)) {
    return {
      ...asset,
      holdingBalance: liveKrw,
      balance: (asset.cashBalance ?? 0) + liveKrw,
    };
  }
  const cashKrw = assetBalanceInKrw({
    balance: asset.cashBalance ?? 0,
    currency: asset.currency,
    exchangeRate: asset.exchangeRate,
  });
  return {
    ...asset,
    currency: "KRW",
    exchangeRate: 1,
    holdingBalance: liveKrw,
    balance: cashKrw + liveKrw,
  };
}
