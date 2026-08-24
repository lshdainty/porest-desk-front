/**
 * 나무증권(NH PLUG) 조회 API — 백엔드 프록시 `/v1/namu/**`.
 *
 * **토스와 나눠 둔 이유** — 두 증권사가 주는 데이터가 겹치지 않는다. 한 모듈에 합치면
 * 함수 절반이 "이 증권사는 미지원" 이 된다.
 */
import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'

/**
 * 증권사 무관 현재가. 백엔드가 증권사별 필드명 차이를 흡수해 이 모양으로 준다
 * (나무 국내 `stck_prpr` / 나무 해외 `trdprc`).
 */
export interface BrokerPrice {
  symbol: string
  price: number
  currency: string
}

export const namuApi = {
  /** 국내주식 현재가. marketCode 는 KRX(기본)·NXT·UNT — NXT 대상 여부는 서버 stock_master 가 안다. */
  getKrPrice: async (symbol: string, marketCode?: string): Promise<BrokerPrice | null> => {
    const resp: ApiResponse<BrokerPrice | null> = await apiClient.get('/v1/namu/kr/price', {
      params: { symbol, ...(marketCode ? { marketCode } : {}) },
    })
    return resp.data ?? null
  },

  /** 해외주식 현재가. */
  getGbPrice: async (symbol: string): Promise<BrokerPrice | null> => {
    const resp: ApiResponse<BrokerPrice | null> = await apiClient.get('/v1/namu/gb/price', {
      params: { symbol },
    })
    return resp.data ?? null
  },
}
