import { useMemo } from 'react'
import { useMyFeatures } from '@/features/subscription/model/useSubscription'
import { useTossPrices, useTossExchangeRate, usePrevCloses } from '@/features/stock/model/useTossStocks'
import { qtyNumber, type Asset, type AssetHolding } from '@/entities/asset'

/** 투자 자산의 라이브 평가 요약 — value(평가액), changeAmt/changePct(전일 대비, 연동 종목만). */
export interface InvestValuation {
  value: number
  changeAmt: number | null
  changePct: number | null
}

/**
 * 자산의 실효 보유 목록 — holdings 가 있으면 그대로, 없고 구버전 단일 연동
 * (tossSymbol+tossQuantity)만 있으면 linked 1건으로 합성(하위호환).
 */
export function holdingsOf(a: Asset): AssetHolding[] {
  if (a.holdings && a.holdings.length > 0) return a.holdings
  if (a.tossSymbol && a.tossQuantity != null) {
    // tossQuantity 는 구버전 bigint 컬럼(정수) — 문자열 수량 계약에 맞춰 넘긴다.
    return [{ linked: true, tossSymbol: a.tossSymbol, quantity: String(a.tossQuantity) }]
  }
  return []
}

/** 보유 목록에서 연동 심볼만 중복 없이 추출. */
export function linkedSymbolsOf(assets: Asset[]): string[] {
  const set = new Set<string>()
  for (const a of assets) {
    for (const h of holdingsOf(a)) {
      if (h.linked && h.tossSymbol) set.add(h.tossSymbol)
    }
  }
  return [...set]
}

/**
 * 투자 자산들의 라이브 평가 맵 (assetRowId → {value, changeAmt, changePct}).
 *
 * - 평가액 = Σ 보유: 연동(linked) = 토스 현재가 × 수량(외화는 환율 환산),
 *   수동 = holdingValue 그대로.
 * - 프로(SECURITIES)+토스 연결이 아니거나, 연동 종목 시세가 하나라도 미확보면
 *   그 자산은 맵에서 제외(DB balance 유지 — 0 왜곡 방지, 기존 단일 연동과 동일 정책).
 * - 등락(changeAmt/Pct)은 전일 종가가 확보된 연동 종목만 합산. 기준이 하나도 없으면 null.
 * - useTossPrices 10초 폴링 → 자산 화면 실시간 갱신.
 */
export function useInvestValuation(investAssets: Asset[]): Map<number, InvestValuation> {
  const { data: features } = useMyFeatures()
  const enabled =
    (features?.features?.includes('SECURITIES') ?? false) && (features?.tossConnected ?? false)
  const symbols = useMemo(() => linkedSymbolsOf(investAssets), [investAssets])
  // 토스 API 는 서버 게이트(SECURITIES 구독) 대상 — 미구독자가 호출하면 403.
  const active = enabled && symbols.length > 0
  const activeSymbols = useMemo(() => (active ? symbols : []), [active, symbols])
  const pricesQ = useTossPrices(activeSymbols)
  const fxQ = useTossExchangeRate(active) // USD→KRW
  const prevCloses = usePrevCloses(activeSymbols)

  return useMemo(() => {
    const map = new Map<number, InvestValuation>()
    if (!active) return map
    const infoBySymbol = new Map<string, { price: number; currency: string }>()
    for (const p of pricesQ.data ?? []) {
      const v = Number.parseFloat(p.lastPrice)
      if (Number.isFinite(v)) infoBySymbol.set(p.symbol, { price: v, currency: p.currency })
    }
    const fx = Number.parseFloat(fxQ.data?.rate ?? '')
    const toKrw = (price: number, currency: string): number | null => {
      if (currency === 'KRW') return price
      // 환율 미확보 외화는 제외(왜곡 방지).
      return Number.isFinite(fx) && fx > 0 ? price * fx : null
    }

    for (const a of investAssets) {
      const hs = holdingsOf(a)
      const linked = hs.filter(h => h.linked && h.tossSymbol)
      if (linked.length === 0) continue // 수동 전용은 DB balance 그대로 사용
      let value = 0
      let changeAmt = 0
      let hasChangeBase = false
      let complete = true
      for (const h of hs) {
        if (h.linked && h.tossSymbol) {
          const info = infoBySymbol.get(h.tossSymbol)
          // 수량은 문자열(BigDecimal 계약) — 화면 표시용 합계라 여기서만 숫자로 푼다.
          const qty = qtyNumber(h.quantity) ?? 0
          const krw = info ? toKrw(info.price, info.currency) : null
          if (krw == null) {
            complete = false
            break
          }
          value += Math.round(krw * qty)
          const prev = prevCloses.get(h.tossSymbol)
          if (prev != null && prev > 0 && info) {
            const prevKrw = toKrw(prev, info.currency)
            if (prevKrw != null) {
              changeAmt += Math.round((krw - prevKrw) * qty)
              hasChangeBase = true
            }
          }
        } else {
          value += h.holdingValue ?? 0
        }
      }
      if (!complete) continue
      const base = value - changeAmt
      const changePct =
        hasChangeBase && base !== 0 ? Math.round((changeAmt / base) * 1000) / 10 : null
      map.set(a.rowId, { value, changeAmt: hasChangeBase ? changeAmt : null, changePct })
    }
    return map
  }, [active, investAssets, pricesQ.data, fxQ.data, prevCloses])
}

/**
 * (하위호환) 토스 연동 투자 자산의 라이브 평가액(KRW) 맵 (assetRowId → 평가액).
 * holdings 도입 후에도 기존 호출부(합계 보정 등)가 값만 쓰는 경우를 위해 유지.
 */
export function useTossValuationMap(linkedAssets: Asset[]): Map<number, number> {
  const full = useInvestValuation(linkedAssets)
  return useMemo(() => {
    const map = new Map<number, number>()
    for (const [k, v] of full) map.set(k, v.value)
    return map
  }, [full])
}
