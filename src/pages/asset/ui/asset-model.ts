import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  assetKeys,
  recurringTransactionKeys,
  savingGoalKeys,
} from "@/shared/config";
import { assetBalanceInKrw } from "@/shared/lib/groo/currency";
import { MASK } from "@/shared/lib/groo/money-text";
import type { HideCardKey } from "@/shared/lib/groo/hide-amounts-cards";
import { useHideAmounts } from "@/shared/lib/groo/hide-amounts-core";
import {
  useAssets,
  useAssetSummary,
  useInvestValuation,
  holdingsOf,
} from "@/features/asset";
import type { Asset, AssetType } from "@/entities/asset";

export type OutletCtx = { onAddTx: () => void; mobile: boolean };

export const ACCOUNT_TYPES: AssetType[] = ["BANK_ACCOUNT", "SAVINGS", "CASH"];
export const CARD_TYPES: AssetType[] = ["CREDIT_CARD", "CHECK_CARD"];
export const INVESTMENT_TYPES: AssetType[] = ["INVESTMENT"];
export const LOAN_TYPES: AssetType[] = ["LOAN"];

/** 줄에서 쓰는 원화 환산 잔액 — 외화는 환율로 환산해 더한다(I-17 Q4 A, 서버 요약과 같은 셈) */
export const krwOf = (a: Asset) => assetBalanceInKrw(a);

/**
 * 카드 사용률 — usage = abs(balance)/creditLimit*100. 한도에 가까워져도 색은 바꾸지 않는다(progress.md) —
 * 넘으면 막대가 끝까지 fg-critical + "N원 초과"(ds Progress limit).
 */
export function cardUsageOf(asset: Asset) {
  if (
    asset.assetType !== "CREDIT_CARD" ||
    asset.creditLimit == null ||
    asset.creditLimit <= 0
  ) {
    return null;
  }
  const used = Math.abs(asset.balance);
  return {
    used,
    limit: asset.creditLimit,
    over: Math.max(0, used - asset.creditLimit),
  };
}

/** 이 카드가 가려졌거나 이 자산만 가렸는가 */
export function useAssetHidden(card: HideCardKey, force = false) {
  return useHideAmounts(card) || force;
}

/** 이 카드가 가려졌거나 이 자산만 가렸으면 "••••" — 화면 카드와 자산 하나의 합집합 */
export function useAssetMask(card: HideCardKey, force = false) {
  const hidden = useAssetHidden(card, force);
  return (text: string) => (hidden ? MASK : text);
}

/** 글 폭이 한도 이하인지 — 도넛 가운데 합계 판정(구멍 − 16) */
export function useFitLimit(limit: number) {
  const ref = useRef<HTMLSpanElement>(null);
  const [fits, setFits] = useState(true);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(() =>
      setFits(el.getBoundingClientRect().width <= limit),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [limit]);
  return [ref, fits] as const;
}

/** 자산 화면이 읽는 자산 묶음 · 합계 — 목록 · 요약 두 쿼리만(추이 · 예정 결제 · 저축 목표는 각 카드가 제 쿼리로) */
export function useAssetGroups() {
  const queryClient = useQueryClient();
  const assetsQ = useAssets();
  const summaryQ = useAssetSummary();
  // 연동 보유가 있는 투자 자산은 라이브 평가액으로 잔액을 덮어쓴다(프로+토스 연결 시에만, 그 외 빈 맵).
  // holdings(다건) 우선, 구버전 단일 tossSymbol 은 holdingsOf 가 합성해 하위호환.
  const linked = useMemo(
    () =>
      (assetsQ.data?.assets ?? []).filter((a) =>
        holdingsOf(a).some((h) => h.linked),
      ),
    [assetsQ.data],
  );
  const investValMap = useInvestValuation(linked);
  const valMap = useMemo(() => {
    const m = new Map<number, number>();
    for (const [k, v] of investValMap) m.set(k, v.value);
    return m;
  }, [investValMap]);

  const groups = useMemo(() => {
    // 연결 종목은 토스 라이브 평가액(시세×수량)으로 치환 → 목록·구성비·합계가 실시간 반영.
    // 라이브 평가는 '보유분'만이라 예수금을 더해야 총액이 된다(안 더하면 증권계좌에 넣어 둔
    // 매수 대기 자금이 목록에서 통째로 빠진다).
    const list: Asset[] = (assetsQ.data?.assets ?? []).map((a) =>
      valMap.has(a.rowId)
        ? {
            ...a,
            holdingBalance: valMap.get(a.rowId)!,
            balance: (a.cashBalance ?? 0) + valMap.get(a.rowId)!,
          }
        : a,
    );
    const accounts = list.filter((a) => ACCOUNT_TYPES.includes(a.assetType));
    const cards = list.filter((a) => CARD_TYPES.includes(a.assetType));
    const investments = list.filter((a) =>
      INVESTMENT_TYPES.includes(a.assetType),
    );
    const loans = list.filter((a) => LOAN_TYPES.includes(a.assetType));
    // 순자산·구성비 집계에는 '총액 포함' 자산만, 외화는 원화로 환산해 더한다 — 백엔드 summary 와 일치.
    const inTotal = (a: Asset) => a.isIncludedInTotal === "Y";
    const sumIncluded = (arr: Asset[]) =>
      arr.filter(inTotal).reduce((s, a) => s + krwOf(a), 0);
    return {
      accounts,
      cards,
      investments,
      loans,
      accountsTotal: sumIncluded(accounts),
      cardsTotal: Math.abs(sumIncluded(cards)),
      investmentsTotal: sumIncluded(investments),
      loansTotal: Math.abs(sumIncluded(loans)),
    };
  }, [assetsQ.data, valMap]);

  // 백엔드 summary(DB 잔액 기준)에 연결 자산의 (라이브−DB) 차액만큼 순자산/변화를 보정.
  //
  // 비교 대상은 평가금액끼리다. 라이브 값은 보유분만 계산하는데 balance 는
  // 예수금 + 평가금액이라, 그걸 빼면 예수금만큼 순자산이 깎인다.
  const liveDelta = useMemo(
    () =>
      linked.reduce((s, a) => {
        if (a.isIncludedInTotal !== "Y") return s;
        const v = valMap.get(a.rowId);
        return v != null ? s + (v - (a.holdingBalance ?? 0)) : s;
      }, 0),
    [linked, valMap],
  );

  const netWorth = (summaryQ.data?.netWorth ?? 0) + liveDelta;
  const changeAmount = (summaryQ.data?.changeAmount ?? 0) + liveDelta;
  const lastMonth = summaryQ.data?.lastMonthNetWorth ?? 0;
  const changePercent =
    lastMonth !== 0
      ? Math.round((changeAmount / Math.abs(lastMonth)) * 10000) / 100
      : (summaryQ.data?.changePercent ?? 0);

  const assetsFailed = assetsQ.isError === true;
  const summaryFailed = summaryQ.isError === true;

  return {
    ...groups,
    investValMap,
    netWorth,
    changeAmount,
    changePercent,
    hasLastMonth: lastMonth !== 0,
    // 카드(띠)마다 따로 — 화면 전체가 한 번에 스켈레톤 ↔ 실패로 도는 게이트를 두지 않는다(I-05 62)
    assetsLoading: assetsQ.isLoading,
    assetsFailed,
    summaryLoading: assetsQ.isLoading || summaryQ.isLoading,
    summaryFailed: assetsFailed || summaryFailed,
    isLoading: assetsQ.isLoading || summaryQ.isLoading,
    isFetching: assetsQ.isFetching || summaryQ.isFetching,
    retryAssets: () => {
      void assetsQ.refetch();
    },
    retrySummary: () => {
      if (assetsFailed) void assetsQ.refetch();
      if (summaryFailed) void summaryQ.refetch();
    },
    // 이 화면이 읽는 건 목록·요약만이 아니다. 순자산 추이(assetKeys.netWorthTrend) ·
    // 저축목표 · 예정 결제(반복 거래)가 같은 화면에 있는데, 목록·요약만 refetch 하던
    // 탓에 새로고침을 눌러도 아래 셋은 옛 값 그대로였다(QA #149).
    // 자산 세 쿼리는 루트 키 하나로 묶이고, 나머지 둘은 자기 루트 키로 비운다.
    //
    // 여기 없는 둘 — 라이브 시세(useLivePrices)는 10초마다 스스로 폴링하고,
    // 종목명(stockKeys.symbolName)은 변하지 않는 마스터 데이터다. 다시 부를 이유가 없다.
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
      queryClient.invalidateQueries({ queryKey: savingGoalKeys.all });
      queryClient.invalidateQueries({ queryKey: recurringTransactionKeys.all });
    },
  };
}

export type AssetGroups = ReturnType<typeof useAssetGroups>;
