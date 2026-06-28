import { useMemo } from 'react'
import { useMyFeatures } from '@/features/subscription/model/useSubscription'
import { useTossPrices, useTossExchangeRate } from '@/features/stock/model/useTossStocks'
import type { Asset } from '@/entities/asset'

/**
 * 토스에 연결된 투자 자산들의 라이브 평가액(KRW) 맵 (assetRowId → 평가액).
 *
 * - 평가액 = 토스 현재가(toss_symbol) × 보유수량(toss_quantity).
 * - 해외 종목(통화≠KRW)은 토스 환율(USD→KRW)로 원화 환산. 환율 미확보 시 그 종목은 제외(기존 잔액 유지).
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
  const fxQ = useTossExchangeRate() // USD→KRW

  return useMemo(() => {
    const map = new Map<number, number>()
    const infoBySymbol = new Map<string, { price: number; currency: string }>()
    for (const p of pricesQ.data ?? []) {
      const v = Number.parseFloat(p.lastPrice)
      if (Number.isFinite(v)) infoBySymbol.set(p.symbol, { price: v, currency: p.currency })
    }
    const fx = Number.parseFloat(fxQ.data?.rate ?? '')
    for (const a of linkedAssets) {
      if (!a.tossSymbol || a.tossQuantity == null) continue
      const info = infoBySymbol.get(a.tossSymbol)
      if (info == null) continue
      // 원화 종목은 그대로, 외화 종목은 환율 환산. 환율 미확보 외화는 제외(왜곡 방지).
      let krw: number
      if (info.currency === 'KRW') {
        krw = info.price
      } else if (Number.isFinite(fx) && fx > 0) {
        krw = info.price * fx
      } else {
        continue
      }
      map.set(a.rowId, Math.round(krw * a.tossQuantity))
    }
    return map
  }, [pricesQ.data, fxQ.data, linkedAssets])
}
