/**
 * 증권사 무관 시세 훅. 자산 화면이 쓴다 — 증권사를 몰라도 된다.
 */
import { useQuery } from '@tanstack/react-query'
import { securitiesApi } from '../api/securitiesApi'

const COMMON = { retry: false, refetchOnWindowFocus: false } as const

/**
 * 보유 종목 현재가. 기본 10초 폴링 — 자산 화면이 라이브로 갱신된다.
 *
 * **폴링 주기를 열어 둔 이유** — 나무는 다건 시세 API 가 없어 서버가 종목마다 1콜을 낸다.
 * 서버 캐시 TTL 이 20초(`NamuProperties.quoteCacheTtlSeconds`)라 10초로 조르면 절반은
 * 캐시에 맞고 절반은 그대로 상류로 나가면서 요청 수만 두 배가 된다. 종목이 많은 화면
 * (관심목록)은 TTL 보다 긴 주기를 줘서 한 주기에 한 번만 나가게 한다.
 */
export const useSecuritiesPrices = (symbols: string[], refetchInterval = 10_000) =>
  useQuery({
    queryKey: ['securities', 'prices', [...symbols].sort()],
    queryFn: () => securitiesApi.getPrices(symbols),
    enabled: symbols.length > 0,
    ...COMMON,
    refetchInterval,
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
