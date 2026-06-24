/**
 * 토스증권 Open API 연동 react-query 훅.
 * 모든 쿼리는 `retry: false` — 키 미설정(503)·백엔드 미기동 시 즉시 실패시켜 호출부가 mock 으로 폴백한다.
 */
import { useEffect, useMemo, useReducer } from 'react'
import { useQuery } from '@tanstack/react-query'
import { stockKeys } from '@/shared/config'
import { applyLivePrices, setLiveFx, STOCKS } from '@/pages/stocks/model/stocksMock'
import { stockApi } from '../api/stockApi'

const COMMON = { retry: false, refetchOnWindowFocus: false, staleTime: 15_000 } as const

// ---- 개별 엔드포인트 훅 ----------------------------------------------------

export const useTossExchangeRate = () =>
  useQuery({
    queryKey: stockKeys.exchangeRate(),
    queryFn: () => stockApi.getExchangeRate('USD', 'KRW'),
    ...COMMON,
    staleTime: 60_000,
  })

export const useTossPrices = (symbols: string[]) =>
  useQuery({
    queryKey: stockKeys.prices(symbols),
    queryFn: () => stockApi.getPrices(symbols),
    enabled: symbols.length > 0,
    ...COMMON,
    // 현재가는 라이브로 — 상세 헤더 가격/등락%·리스트 시세가 주기적으로 갱신된다.
    // (탭이 백그라운드면 react-query 가 기본적으로 폴링 일시정지)
    refetchInterval: 10_000,
  })

export const useTossOrderbook = (symbol: string | null) =>
  useQuery({
    queryKey: stockKeys.orderbook(symbol ?? ''),
    queryFn: () => stockApi.getOrderbook(symbol!),
    enabled: !!symbol,
    ...COMMON,
    staleTime: 3_000,
    // 호가는 변동이 잦음 → 5초 폴링. 백그라운드 탭 자동 일시정지.
    refetchInterval: 5_000,
  })

export const useTossTrades = (symbol: string | null, count = 20) =>
  useQuery({
    queryKey: stockKeys.trades(symbol ?? ''),
    queryFn: () => stockApi.getTrades(symbol!, count),
    enabled: !!symbol,
    ...COMMON,
    staleTime: 3_000,
    // 체결 테이프도 5초 폴링.
    refetchInterval: 5_000,
  })

export const useTossPriceLimits = (symbol: string | null) =>
  useQuery({
    queryKey: stockKeys.priceLimits(symbol ?? ''),
    queryFn: () => stockApi.getPriceLimits(symbol!),
    enabled: !!symbol,
    ...COMMON,
  })

export const useTossStockInfo = (symbols: string[]) =>
  useQuery({
    queryKey: stockKeys.stockInfo(symbols),
    queryFn: () => stockApi.getStocks(symbols),
    enabled: symbols.length > 0,
    ...COMMON,
    staleTime: 5 * 60_000,
  })

export const useTossCandles = (symbol: string | null, interval: '1m' | '1d', count?: number) =>
  useQuery({
    queryKey: stockKeys.candles(symbol ?? '', `${interval}:${count ?? ''}`),
    queryFn: () => stockApi.getCandles(symbol!, interval, count ? { count } : undefined),
    enabled: !!symbol,
    ...COMMON,
    // 일별표·등락률 계산용 캔들도 주기 갱신 — 1m 은 15초, 1d 는 60초.
    refetchInterval: interval === '1m' ? 15_000 : 60_000,
  })

export const useTossStockWarnings = (symbol: string | null) =>
  useQuery({
    queryKey: stockKeys.warnings(symbol ?? ''),
    queryFn: () => stockApi.getStockWarnings(symbol!),
    enabled: !!symbol,
    ...COMMON,
    staleTime: 5 * 60_000,
  })

export const useTossMarketCalendarKr = () =>
  useQuery({
    queryKey: stockKeys.marketCalendar('KR'),
    queryFn: () => stockApi.getMarketCalendarKr(),
    ...COMMON,
    staleTime: 5 * 60_000,
  })

export const useTossMarketCalendarUs = () =>
  useQuery({
    queryKey: stockKeys.marketCalendar('US'),
    queryFn: () => stockApi.getMarketCalendarUs(),
    ...COMMON,
    staleTime: 5 * 60_000,
  })

export const useTossAccounts = () =>
  useQuery({
    queryKey: stockKeys.accounts(),
    queryFn: () => stockApi.getAccounts(),
    ...COMMON,
    staleTime: 5 * 60_000,
  })

export const useTossHoldings = (accountSeq: number | null) =>
  useQuery({
    queryKey: stockKeys.holdings(accountSeq ?? 0),
    queryFn: () => stockApi.getHoldings(accountSeq!),
    enabled: !!accountSeq,
    ...COMMON,
    staleTime: 5_000,
    // 보유종목 평가액은 현재가 반영 → 라이브로 갱신(상세 보유정보·포트폴리오 도넛).
    // 백그라운드 탭은 react-query 가 자동 일시정지.
    refetchInterval: 10_000,
  })

// ---- 라이브 오버레이 브리지 ------------------------------------------------

/**
 * 화면 진입 시 전체 종목의 라이브 시세·환율을 받아 mock 모듈에 적용한다(키 있으면 실데이터, 없으면 무변경).
 * STOCKS[].price / FX_USDKRW 를 갱신하고 변경 시 강제 리렌더 → 리스트·상세·요약이 실시세로 표시된다.
 */
export function useStockLiveOverlay() {
  const symbols = useMemo(() => STOCKS.map(s => s.ticker), [])
  const pricesQ = useTossPrices(symbols)
  const fxQ = useTossExchangeRate()
  const [, force] = useReducer((c: number) => c + 1, 0)

  useEffect(() => {
    if (!pricesQ.data) return
    const map: Record<string, number> = {}
    for (const p of pricesQ.data) {
      const v = Number.parseFloat(p.lastPrice)
      if (Number.isFinite(v)) map[p.symbol] = v
    }
    if (applyLivePrices(map)) force()
  }, [pricesQ.data])

  useEffect(() => {
    if (!fxQ.data) return
    if (setLiveFx(Number.parseFloat(fxQ.data.rate))) force()
  }, [fxQ.data])

  return { pricesLive: !!pricesQ.data, fxLive: !!fxQ.data }
}
