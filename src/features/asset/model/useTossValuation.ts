import { useMemo } from 'react'
import { useMyFeatures } from '@/features/subscription/model/useSubscription'
import { useTossPrices } from '@/features/stock/model/useTossStocks'
import type { Asset } from '@/entities/asset'

/**
 * 토스에 연결된 투자 자산들의 라이브 평가액(KRW) 맵 (assetRowId → 평가액).
 *
 * - 평가액 = 토스 현재가(toss_symbol) × 보유수량(toss_quantity). 토스 계좌 보유분과 무관하게
 *   시세만 빌려 계산하므로, 타 증권사 보유 주식도 토스 시세로 실시간 평가된다.
 * - 프로(SECURITIES) + 토스 연결 사용자가 아니거나 연결 자산이 없으면 빈 맵 → 오버레이 무효과.
 * - useTossPrices 가 10초 폴링이라 자산 페이지 금액이 실시간 갱신된다.
 */
export function useTossValuationMap(linkedAssets: Asset[]): Map<number, number> {
  const { data: features } = useMyFeatures()
  const enabled =
    (features?.features?.includes('SECURITIES') ?? false) && (features?.tossConnected ?? false)
  const symbols = useMemo(
    () => [...new Set(linkedAssets.map(a => a.tossSymbol).filter((s): s is string => !!s))],
    [linkedAssets],
  )
  const pricesQ = useTossPrices(enabled ? symbols : [])

  return useMemo(() => {
    const map = new Map<number, number>()
    const priceBySymbol = new Map<string, number>()
    for (const p of pricesQ.data ?? []) {
      const v = Number.parseFloat(p.lastPrice)
      if (Number.isFinite(v)) priceBySymbol.set(p.symbol, v)
    }
    for (const a of linkedAssets) {
      if (!a.tossSymbol || a.tossQuantity == null) continue
      const price = priceBySymbol.get(a.tossSymbol)
      if (price == null) continue
      map.set(a.rowId, Math.round(price * a.tossQuantity))
    }
    return map
  }, [pricesQ.data, linkedAssets])
}
