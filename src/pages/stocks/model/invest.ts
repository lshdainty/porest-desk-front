/**
 * 증권 화면의 값 묶음 — 폰 · 데스크톱 · 앱이 같은 셈을 쓴다(I-13 A.3).
 *
 * 화면이 타일 배열 안에서 셈하던 것을 꺼냈다. 그리기는 화면이 하고, 여기는 숫자만 만든다.
 * 금액은 숫자로 들고 글로 만드는 일(원 · 달러 · 가리기)은 화면이 한다.
 */
import type {
  TossHoldings,
  TossHoldingsItem,
} from "@/features/stock/api/stockApi";
import { num } from "@/features/stock/lib/format";
import {
  krwValueOf,
  type CurrencyTotal,
  type MergedHoldingsView,
} from "@/features/stock/lib/holdings";

/** 증감 방향 — ds Delta 의 방향. 좋고 나쁨이 아니라 오르내림이다 */
export type Direction = "up" | "down" | "flat";
export const directionOf = (n: number): Direction =>
  n > 0 ? "up" : n < 0 ? "down" : "flat";

/** 소수 둘째 자리에서 0 으로 반올림되면 변화 없음으로 본다(0.004% 에 화살표를 달지 않는다) */
export const directionOfPct = (pct: number): Direction =>
  directionOf(Math.round(pct * 100) / 100);

// ---- 내 투자 요약 -----------------------------------------------------------

export interface InvestSummary {
  evalAmount: number;
  purchaseAmount: number;
  pnl: number;
  pnlPct: number;
  dailyPnl: number;
  dailyPnlPct: number;
  /** 보유 종목 수 */
  count: number;
}

/** 토스 보유 응답 → 요약. 서버가 센 값을 그대로 쓴다(원화 합계 `krw`) */
export function tossInvestSummary(h: TossHoldings): InvestSummary {
  return {
    evalAmount: num(h.marketValue.amount.krw),
    purchaseAmount: num(h.totalPurchaseAmount.krw),
    pnl: num(h.profitLoss.amount.krw),
    pnlPct: num(h.profitLoss.rate),
    dailyPnl: num(h.dailyProfitLoss.amount.krw),
    dailyPnlPct: num(h.dailyProfitLoss.rate),
    count: h.items.length,
  };
}

/** 나무 요약 — 통화가 섞이면 원화 환산 합계, 아니면 그 통화의 합계(I-13 8) */
export interface NamuInvestSummary {
  /** 두 통화가 다 있다 */
  mixed: boolean;
  /** 원화 환산 총액 — 환율이 있고 섞였을 때 */
  totalKrw: number | null;
  appliedFxRate: number | null;
  krw: CurrencyTotal | null;
  usd: CurrencyTotal | null;
  count: number;
  krwCount: number;
  usdCount: number;
}

export function namuInvestSummary(view: MergedHoldingsView): NamuInvestSummary {
  return {
    mixed: view.krw != null && view.usd != null,
    totalKrw: view.krw != null && view.usd != null ? view.totalKrw : null,
    appliedFxRate: view.appliedFxRate,
    krw: view.krw,
    usd: view.usd,
    count: view.count,
    krwCount: view.krw?.count ?? 0,
    usdCount: view.usd?.count ?? 0,
  };
}

// ---- 보유 줄 -----------------------------------------------------------------

/** 보유 한 줄 — 종목 통화 그대로의 금액과 원화 환산(비중 · 정렬용) */
export interface HoldingLine {
  key: string;
  symbol: string;
  name: string;
  qty: number;
  /** 종목 통화 기준 평가금액 */
  value: number;
  currency: string;
  pnl: number;
  /** 수익률(%) */
  returnPct: number;
  /** 원화 환산 평가금액 — 환율이 없는 외화면 null */
  krwValue: number | null;
}

const krwOfAmount = (
  amount: number,
  currency: string,
  fx: number | null,
): number | null =>
  currency === "KRW" ? amount : fx != null && fx > 0 ? amount * fx : null;

/**
 * 토스 보유 줄. **정렬은 원화 환산 평가금액 큰 순**(Q5-A, 나무와 같은 셈) — 달러 금액을 원 금액과 그대로 견주지 않는다.
 * 환율이 없으면 환산할 수 없으니 원화 → 외화 순으로 묶고 각 묶음 안에서만 큰 순으로 센다.
 */
export function tossHoldingLines(
  items: TossHoldingsItem[],
  fxRate: number | null,
): HoldingLine[] {
  const lines = items.map<HoldingLine>((h) => {
    const value = num(h.marketValue.amount);
    const currency = h.currency.toUpperCase();
    return {
      key: h.symbol,
      symbol: h.symbol,
      name: h.name || h.symbol,
      qty: num(h.quantity),
      value,
      currency,
      pnl: num(h.profitLoss.amount),
      returnPct: num(h.profitLoss.rate),
      krwValue: krwOfAmount(value, currency, fxRate),
    };
  });
  return sortHoldingLines(lines);
}

export function sortHoldingLines(lines: HoldingLine[]): HoldingLine[] {
  const mixedUnknown = lines.some((l) => l.krwValue == null);
  if (!mixedUnknown)
    return [...lines].sort((a, b) => b.krwValue! - a.krwValue!);
  const byValue = (a: HoldingLine, b: HoldingLine) => b.value - a.value;
  return [
    ...lines.filter((l) => l.currency === "KRW").sort(byValue),
    ...lines.filter((l) => l.currency !== "KRW").sort(byValue),
  ];
}

/** 나무 보유 줄 — `view.rows` 는 이미 정렬돼 온다(mergeNamuHoldings) */
export function namuHoldingLines(view: MergedHoldingsView): HoldingLine[] {
  return view.rows.map((r) => {
    const value = num(r.evalAmount);
    const pnl = num(r.profitLoss);
    const cost = value - pnl;
    return {
      key: `${r.currency}:${r.symbol}`,
      symbol: r.symbol,
      name: r.name || r.symbol,
      qty: num(r.quantity),
      value,
      currency: r.currency,
      pnl,
      returnPct: cost > 0 ? (pnl / cost) * 100 : 0,
      krwValue:
        r.currency === "KRW"
          ? value
          : view.appliedFxRate != null
            ? krwValueOf(r, view.appliedFxRate)
            : null,
    };
  });
}

// ---- 포트폴리오 구성 ---------------------------------------------------------

export interface CompositionItem {
  key: string;
  name: string;
  /** 원화 환산 비중(%) */
  pct: number;
  krwValue: number;
}

export interface Composition {
  items: CompositionItem[];
  /** 환율이 없어 비중을 낼 수 없다 — 도넛 대신 안내 */
  fxMissing: boolean;
}

/** 구성 비중 — 척도가 하나로 안 잡히면(외화인데 환율 없음) 비중을 내지 않는다 */
export function composition(lines: HoldingLine[]): Composition {
  if (lines.some((l) => l.krwValue == null))
    return { items: [], fxMissing: true };
  const total = lines.reduce((s, l) => s + (l.krwValue ?? 0), 0);
  const items = [...lines]
    .sort((a, b) => b.krwValue! - a.krwValue!)
    .map<CompositionItem>((l) => ({
      key: l.key,
      name: l.name,
      krwValue: l.krwValue!,
      pct: total > 0 ? (l.krwValue! / total) * 100 : 0,
    }));
  return { items, fxMissing: false };
}
