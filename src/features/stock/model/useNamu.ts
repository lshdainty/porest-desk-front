/**
 * 나무증권 조회 훅. 토스와 나눠 둔다 — 두 증권사가 주는 데이터가 겹치지 않는다.
 */
import { useQuery } from '@tanstack/react-query'
import { namuApi } from '../api/namuApi'
import type { StockMasterItem } from '../api/stockApi'

/** 선택 종목의 나무 현재가. 국내·해외 분기는 stock_master 의 국가코드가 정한다. */
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
