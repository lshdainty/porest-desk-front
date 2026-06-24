/**
 * 토스증권 Open API 연동 클라이언트 (백엔드 조회 프록시 `/api/v1/toss/**` 호출).
 * 백엔드 응답 계약(com.porest.desk.toss.dto)에 정확히 맞춘 타입.
 * 가격·수량·금액은 백엔드가 정밀도 보존을 위해 String 으로 내려주므로 그대로 string 으로 받는다.
 *
 * 키 미설정 시 백엔드가 503(TOSS_NOT_CONFIGURED)을 반환 → 호출부에서 mock 폴백.
 */
import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'

// ---- 응답 타입 (백엔드 toss DTO 미러) -------------------------------------

export interface TossPrice {
  symbol: string
  timestamp: string | null
  lastPrice: string
  currency: string
}

export interface TossOrderbookEntry {
  price: string
  volume: string
}

export interface TossOrderbook {
  timestamp: string | null
  currency: string
  asks: TossOrderbookEntry[]
  bids: TossOrderbookEntry[]
}

export interface TossTrade {
  price: string
  volume: string
  timestamp: string
  currency: string
}

export interface TossCandle {
  timestamp: string
  openPrice: string
  highPrice: string
  lowPrice: string
  closePrice: string
  volume: string
  currency: string
}

/**
 * 백엔드 candle 응답 원형 — porest-core CursorResponse<Candle>.
 * 클라 내부에서는 {@link TossCandlePage}(candles/nextBefore)로 정규화해 사용한다.
 */
export interface TossCandleCursorPage {
  content: TossCandle[]
  meta: { size: number; hasNext: boolean; nextCursor: string | null }
}

/** 클라 내부 정규화 캔들 페이지 (content→candles, meta.nextCursor→nextBefore). */
export interface TossCandlePage {
  candles: TossCandle[]
  nextBefore: string | null
}

/** 국내 종목 전용 상세(KOSPI/KOSDAQ 등). 해외 종목은 null. */
export interface TossKrMarketDetail {
  liquidationTrading: boolean
  nxtSupported: boolean
  krxTradingSuspended: boolean
  nxtTradingSuspended: boolean
}

export interface TossStockInfo {
  symbol: string
  name: string
  englishName: string
  isinCode: string
  market: string
  securityType: string
  isCommonShare: boolean
  status: string
  currency: string
  listDate: string | null
  delistDate: string | null
  sharesOutstanding: string
  leverageFactor: string | null
  /** 국내 종목 상세(거래정지 등). 거래정지 판정은 status 가 아니라 krxTradingSuspended 로. */
  koreanMarketDetail: TossKrMarketDetail | null
}

export interface TossStockWarning {
  warningType: string
  exchange: string | null
  startDate: string | null
  endDate: string | null
}

export interface TossExchangeRate {
  baseCurrency: string
  quoteCurrency: string
  rate: string
  midRate: string
  basisPoint: string
  rateChangeType: 'UP' | 'EQUAL' | 'DOWN'
  validFrom: string
  validUntil: string
}

/** 시장 세션 (시작/종료 시각). 휴장이면 상위에서 null */
export interface TossMarketSession {
  startTime: string
  endTime: string
}

export interface TossKrIntegratedHour {
  preMarket: TossMarketSession | null
  regularMarket: TossMarketSession | null
  afterMarket: TossMarketSession | null
}

export interface TossKrMarketDay {
  date: string
  integrated: TossKrIntegratedHour | null
}

export interface TossKrMarketCalendar {
  today: TossKrMarketDay
  previousBusinessDay: TossKrMarketDay
  nextBusinessDay: TossKrMarketDay
}

export interface TossUsMarketDay {
  date: string
  dayMarket: TossMarketSession | null
  preMarket: TossMarketSession | null
  regularMarket: TossMarketSession | null
  afterMarket: TossMarketSession | null
}

export interface TossUsMarketCalendar {
  today: TossUsMarketDay
  previousBusinessDay: TossUsMarketDay
  nextBusinessDay: TossUsMarketDay
}

export interface TossAccount {
  accountNo: string
  accountSeq: number
  accountType: string
}

/** 통화별 금액 (원화 필수, 외화 nullable) */
export interface TossPriceAmount {
  krw: string
  usd: string | null
}

export interface TossHoldingsItem {
  symbol: string
  name: string
  marketCountry: string
  currency: string
  quantity: string
  lastPrice: string
  averagePurchasePrice: string
  marketValue: { purchaseAmount: string; amount: string; amountAfterCost: string }
  profitLoss: { amount: string; amountAfterCost: string; rate: string; rateAfterCost: string }
  dailyProfitLoss: { amount: string; rate: string }
  cost: { commission: string; tax: string | null }
}

export interface TossHoldings {
  totalPurchaseAmount: TossPriceAmount
  marketValue: { amount: TossPriceAmount; amountAfterCost: TossPriceAmount }
  profitLoss: { amount: TossPriceAmount; amountAfterCost: TossPriceAmount; rate: string; rateAfterCost: string }
  dailyProfitLoss: { amount: TossPriceAmount; rate: string }
  items: TossHoldingsItem[]
}

export interface TossPriceLimit {
  timestamp: string
  upperLimitPrice: string | null
  lowerLimitPrice: string | null
  currency: string
}

// ---- 클라이언트 ------------------------------------------------------------

const BASE = '/v1/toss'

/** 토스 candles 의 count 상한(min:1 max:200). 초과 요청은 before 커서로 페이지네이션. */
const TOSS_CANDLE_MAX = 200

export const stockApi = {
  // 시세
  getPrices: async (symbols: string[]): Promise<TossPrice[]> => {
    const resp: ApiResponse<TossPrice[]> = await apiClient.get(`${BASE}/prices`, {
      params: { symbols: symbols.join(',') },
    })
    return resp.data
  },

  getOrderbook: async (symbol: string): Promise<TossOrderbook> => {
    const resp: ApiResponse<TossOrderbook> = await apiClient.get(`${BASE}/orderbook`, {
      params: { symbol },
    })
    return resp.data
  },

  getTrades: async (symbol: string, count?: number): Promise<TossTrade[]> => {
    const resp: ApiResponse<TossTrade[]> = await apiClient.get(`${BASE}/trades`, {
      params: { symbol, count },
    })
    return resp.data
  },

  getPriceLimits: async (symbol: string): Promise<TossPriceLimit> => {
    const resp: ApiResponse<TossPriceLimit> = await apiClient.get(`${BASE}/price-limits`, {
      params: { symbol },
    })
    return resp.data
  },

  getCandles: async (
    symbol: string,
    interval: '1m' | '1d',
    opts?: { count?: number; before?: string; adjusted?: boolean },
  ): Promise<TossCandlePage> => {
    // 백엔드는 커서 단일 페이지(size≤200) 프록시 → content/meta.nextCursor 를 정규화해 받는다.
    const fetchPage = async (size?: number, cursor?: string): Promise<TossCandlePage> => {
      const resp: ApiResponse<TossCandleCursorPage> = await apiClient.get(`${BASE}/candles`, {
        params: { symbol, interval, size, cursor, adjusted: opts?.adjusted },
      })
      return { candles: resp.data?.content ?? [], nextBefore: resp.data?.meta?.nextCursor ?? null }
    }

    const wanted = opts?.count
    // count 미지정 또는 ≤200 → 단일 요청 (기존 동작)
    if (!wanted || wanted <= TOSS_CANDLE_MAX) {
      return fetchPage(wanted, opts?.before)
    }

    // 토스 count 상한(200) 초과 → nextCursor 커서로 누적 (요청당 ≤200)
    const merged: TossCandle[] = []
    const seen = new Set<string>()
    let cursor = opts.before
    let nextBefore: string | null = null
    let remaining = wanted
    while (remaining > 0) {
      const page = await fetchPage(Math.min(remaining, TOSS_CANDLE_MAX), cursor)
      if (page.candles.length === 0) break
      for (const c of page.candles) {
        if (!seen.has(c.timestamp)) {
          seen.add(c.timestamp)
          merged.push(c)
        }
      }
      nextBefore = page.nextBefore
      remaining -= page.candles.length
      if (!page.nextBefore) break
      cursor = page.nextBefore
    }
    return { candles: merged, nextBefore }
  },

  // 종목 정보
  getStocks: async (symbols: string[]): Promise<TossStockInfo[]> => {
    const resp: ApiResponse<TossStockInfo[]> = await apiClient.get(`${BASE}/stocks`, {
      params: { symbols: symbols.join(',') },
    })
    return resp.data
  },

  getStockWarnings: async (symbol: string): Promise<TossStockWarning[]> => {
    const resp: ApiResponse<TossStockWarning[]> = await apiClient.get(
      `${BASE}/stocks/${encodeURIComponent(symbol)}/warnings`,
    )
    return resp.data
  },

  // 시장 정보
  getExchangeRate: async (
    baseCurrency = 'USD',
    quoteCurrency = 'KRW',
    dateTime?: string,
  ): Promise<TossExchangeRate> => {
    const resp: ApiResponse<TossExchangeRate> = await apiClient.get(`${BASE}/exchange-rate`, {
      params: { baseCurrency, quoteCurrency, dateTime },
    })
    return resp.data
  },

  getMarketCalendarKr: async (date?: string): Promise<TossKrMarketCalendar> => {
    const resp: ApiResponse<TossKrMarketCalendar> = await apiClient.get(`${BASE}/market-calendar/KR`, {
      params: { date },
    })
    return resp.data
  },

  getMarketCalendarUs: async (date?: string): Promise<TossUsMarketCalendar> => {
    const resp: ApiResponse<TossUsMarketCalendar> = await apiClient.get(`${BASE}/market-calendar/US`, {
      params: { date },
    })
    return resp.data
  },

  // 계좌 / 보유자산
  getAccounts: async (): Promise<TossAccount[]> => {
    const resp: ApiResponse<TossAccount[]> = await apiClient.get(`${BASE}/accounts`)
    return resp.data
  },

  getHoldings: async (accountSeq: number, symbol?: string): Promise<TossHoldings> => {
    const resp: ApiResponse<TossHoldings> = await apiClient.get(`${BASE}/holdings`, {
      params: { accountSeq, symbol },
    })
    return resp.data
  },
}
