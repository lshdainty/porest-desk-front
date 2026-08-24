/**
 * 증권사 무관 시세 API — 백엔드 프록시 `/v1/securities/**`.
 *
 * **왜 토스 경로를 안 쓰나** — 가계부 자산 화면은 현재가와 환율만 있으면 되는데,
 * `/v1/toss/**` 를 직접 부르면 **나무만 연결한 사용자가 403 을 맞아 평가액이 0/누락으로**
 * 보인다. 여기서는 서버가 사용자가 고른 기본 소스로 대신 조회한다.
 *
 * 증권사별 조회(`/v1/toss/**` · `/v1/namu/**`)는 증권 화면이 그대로 쓴다 — 증권사마다
 * 보여주는 게 달라 합칠 수 없다.
 */
import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'

/** 증권사 무관 현재가. 금액은 JSON 숫자로 온다(서버가 BigDecimal 로 계산해 내린다). */
export interface BrokerQuote {
  symbol: string
  price: number
  currency: string
  /**
   * 전일 종가. **못 주는 증권사가 있어 null 이 될 수 있다** — 나무는 시세 응답에 전일대비가
   * 딸려 와 공짜로 채우지만, 토스는 캔들을 종목마다 따로 받아야 해서 비어 온다.
   * 등락 표시에만 쓰이고 평가액에는 영향이 없다.
   */
  previousClose: number | null
}

export interface BrokerExchangeRate {
  base: string
  quote: string
  /** 못 구하면 null — 나무는 해당 통화 보유 종목이 있어야 환율이 나온다. */
  rate: number | null
}

export const securitiesApi = {
  getPrices: async (symbols: string[]): Promise<BrokerQuote[]> => {
    if (symbols.length === 0) return []
    const resp: ApiResponse<BrokerQuote[]> = await apiClient.get('/v1/securities/prices', {
      params: { symbols: symbols.join(',') },
    })
    return resp.data ?? []
  },

  getExchangeRate: async (base = 'USD', quote = 'KRW'): Promise<BrokerExchangeRate> => {
    const resp: ApiResponse<BrokerExchangeRate> = await apiClient.get('/v1/securities/exchange-rate', {
      params: { base, quote },
    })
    return resp.data
  },
}
