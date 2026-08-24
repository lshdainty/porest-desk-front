/**
 * 증권사 무관 시세 훅. 자산 화면이 쓴다 — 증권사를 몰라도 된다.
 */
import { useQuery } from '@tanstack/react-query'
import { securitiesApi } from '../api/securitiesApi'

const COMMON = { retry: false, refetchOnWindowFocus: false } as const

/** 보유 종목 현재가. 10초 폴링 — 자산 화면이 라이브로 갱신된다. */
export const useSecuritiesPrices = (symbols: string[]) =>
  useQuery({
    queryKey: ['securities', 'prices', [...symbols].sort()],
    queryFn: () => securitiesApi.getPrices(symbols),
    enabled: symbols.length > 0,
    ...COMMON,
    refetchInterval: 10_000,
  })

/** 원화 환산 환율. 못 구하면 rate 가 null 로 온다. */
export const useSecuritiesExchangeRate = (enabled = true) =>
  useQuery({
    queryKey: ['securities', 'exchange-rate', 'USD', 'KRW'],
    queryFn: () => securitiesApi.getExchangeRate('USD', 'KRW'),
    enabled,
    ...COMMON,
    staleTime: 60_000,
  })
