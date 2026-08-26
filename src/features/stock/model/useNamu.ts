/**
 * 나무증권 조회 훅. 토스와 나눠 둔다 — 두 증권사가 주는 데이터가 겹치지 않는다.
 */
import { useQuery } from '@tanstack/react-query'
import { namuApi } from '../api/namuApi'
import type { StockMasterItem } from '../api/stockApi'

/** 나무 보유 종목. 통화가 KRW 면 국내, 그 밖이면 해외 — 서버가 엔드포인트를 가른다. */
export function useNamuHoldings(currency: string) {
  return useQuery({
    queryKey: ['namu', 'holdings', currency],
    queryFn: () => namuApi.getHoldings(currency),
    retry: false,
    staleTime: 30_000,
  })
}

/**
 * 선택 종목의 나무 현재가 **1건**. 국내·해외 분기는 stock_master 의 국가코드가 정한다.
 *
 * ⚠️ **목록에 걸지 마라.** 나무엔 다건 시세 API 가 없어 이 훅 하나가 곧 상류 1콜이다 —
 * 행마다 걸면 종목 수만큼 나가 유량 제한(429)에 걸린다. 여러 종목이 필요하면
 * {@link useSecuritiesPrices}(서버 대리 다건 조회 `/v1/securities/prices`)를 써라.
 * 서버가 상한(50)·캐시(20초)·시간예산(4초)을 쥐고 있고 전일종가까지 함께 준다.
 */
export function useNamuPrice(item: StockMasterItem | null) {
  return useQuery({
    queryKey: ['namu', 'price', item?.marketCode, item?.symbol],
    queryFn: () =>
      item!.countryCode === 'KR' ? namuApi.getKrPrice(item!.symbol) : namuApi.getGbPrice(item!.symbol),
    enabled: !!item,
    retry: false,
    staleTime: 10_000,
  })
}
