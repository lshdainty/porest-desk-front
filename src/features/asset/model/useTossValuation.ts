import { useMemo } from 'react'
import { useMyFeatures } from '@/features/subscription/model/useSubscription'
import { useTossHoldings, useTossExchangeRate } from '@/features/stock/model/useTossStocks'
import type { Asset } from '@/entities/asset'

/**
 * 토스에 연결된 투자 자산들의 라이브 평가액(KRW) 맵 (symbol → 원화 평가액).
 *
 * - 프로(SECURITIES) + 토스 연결 사용자가 아니거나 연결 자산이 없으면 빈 맵 → 오버레이 무효과.
 * - holdings 는 10초 폴링(useTossHoldings)이라 자산 페이지 금액이 실시간 갱신된다.
 * - 평가액은 토스가 직접 내려준 값(marketValue.amount). 해외 종목(통화≠KRW)은 환율로 원화 환산.
 * - 단순화: 연결 자산은 동일 토스 계좌(첫 계좌)에 있다고 가정해 첫 tossAccountSeq 로 조회한다.
 *   다른 계좌 종목은 맵에 없어 오버레이되지 않고 기존(DB) 잔액을 유지한다(안전한 폴백).
 */
export function useTossValuationMap(linkedAssets: Asset[]): Map<string, number> {
  const { data: features } = useMyFeatures()
  const enabled =
    (features?.features?.includes('SECURITIES') ?? false) && (features?.tossConnected ?? false)
  const accountSeq = linkedAssets.find(a => a.tossAccountSeq != null)?.tossAccountSeq ?? null
  const holdingsQ = useTossHoldings(enabled && accountSeq != null ? accountSeq : null)
  const fxQ = useTossExchangeRate()

  return useMemo(() => {
    const map = new Map<string, number>()
    const items = holdingsQ.data?.items
    if (!items) return map
    const fx = Number.parseFloat(fxQ.data?.rate ?? '')
    for (const it of items) {
      const amt = Number.parseFloat(it.marketValue?.amount ?? '')
      if (!Number.isFinite(amt)) continue
      const krw =
        it.currency === 'KRW' ? amt : Number.isFinite(fx) && fx > 0 ? amt * fx : amt
      map.set(it.symbol, Math.round(krw))
    }
    return map
  }, [holdingsQ.data, fxQ.data])
}
