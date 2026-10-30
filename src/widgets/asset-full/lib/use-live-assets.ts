import { useMemo } from "react";
import { withLiveValuation, type Asset } from "@/entities/asset";
import { holdingsOf, useInvestValuation } from "@/features/asset";

/**
 * 투자 자산의 라이브 평가 — 자산 화면과 계좌 · 카드 관리가 **같은 훅**을 쓴다(I-17 후속: 관리 줄 금액이 자산 화면과 다르면 틀려 보인다).
 * 연동 보유가 있는 투자 자산은 라이브 평가액(시세 × 수량)으로 잔액을 덮어쓴다(프로 + 증권 연결 시에만, 그 외 빈 맵).
 * 라이브 평가는 '보유분'만이라 예수금을 더해야 총액이 된다(안 더하면 매수 대기 자금이 목록에서 빠진다).
 * 시세 구독은 목록당 한 번(줄마다 타이머를 두지 않는다) — 같은 쿼리 키라 자산 화면과 오가도 중복 요청이 없다.
 */
export function useLiveAssets(assets: Asset[]) {
  const linked = useMemo(
    () => assets.filter((a) => holdingsOf(a).some((h) => h.linked)),
    [assets],
  );
  const investValMap = useInvestValuation(linked);
  const valMap = useMemo(() => {
    const m = new Map<number, number>();
    for (const [k, v] of investValMap) m.set(k, v.value);
    return m;
  }, [investValMap]);
  // 라이브 평가는 원화 — 외화 자산은 환율을 두 번 곱하지 않게 원화 잔액으로 얹는다(withLiveValuation)
  const list: Asset[] = useMemo(
    () =>
      assets.map((a) =>
        valMap.has(a.rowId) ? withLiveValuation(a, valMap.get(a.rowId)!) : a,
      ),
    [assets, valMap],
  );
  return { list, linked, investValMap, valMap };
}
