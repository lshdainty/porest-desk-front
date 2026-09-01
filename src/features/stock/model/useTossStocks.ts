/**
 * 토스증권 Open API 연동 react-query 훅.
 * 모든 쿼리는 `retry: false` — 키 미설정(503)·백엔드 미기동 시 즉시 실패시켜 호출부가 mock 으로 폴백한다.
 */
import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { stockKeys } from "@/shared/config";
import { todayLocalKey } from "@/shared/lib/date";
import {
  stockApi,
  type TossRankingDuration,
  type TossRankingType,
} from "../api/stockApi";

const COMMON = {
  retry: false,
  refetchOnWindowFocus: false,
  staleTime: 15_000,
} as const;

// ---- 개별 엔드포인트 훅 ----------------------------------------------------

/**
 * USD→KRW 환율. `/api/v1/toss/**` 는 서버 게이트(SECURITIES 구독) 대상이라
 * 미구독자가 호출하면 403 → 전역 토스트. 호출부가 구독·필요 여부를 판단해 enabled 를 넘긴다.
 */
export const useTossExchangeRate = (enabled = true) =>
  useQuery({
    queryKey: stockKeys.exchangeRate(),
    queryFn: () => stockApi.getExchangeRate("USD", "KRW"),
    enabled,
    ...COMMON,
    staleTime: 60_000,
  });

export const useTossPrices = (symbols: string[]) =>
  useQuery({
    queryKey: stockKeys.prices(symbols),
    queryFn: () => stockApi.getPrices(symbols),
    enabled: symbols.length > 0,
    ...COMMON,
    // 현재가는 라이브로 — 상세 헤더 가격/등락%·리스트 시세가 주기적으로 갱신된다.
    // (탭이 백그라운드면 react-query 가 기본적으로 폴링 일시정지)
    refetchInterval: 10_000,
  });

export const useTossOrderbook = (symbol: string | null) =>
  useQuery({
    queryKey: stockKeys.orderbook(symbol ?? ""),
    queryFn: () => stockApi.getOrderbook(symbol!),
    enabled: !!symbol,
    ...COMMON,
    staleTime: 3_000,
    // 호가는 변동이 잦음 → 5초 폴링. 백그라운드 탭 자동 일시정지.
    refetchInterval: 5_000,
  });

export const useTossTrades = (symbol: string | null, count = 20) =>
  useQuery({
    queryKey: stockKeys.trades(symbol ?? ""),
    queryFn: () => stockApi.getTrades(symbol!, count),
    enabled: !!symbol,
    ...COMMON,
    staleTime: 3_000,
    // 체결 테이프도 5초 폴링.
    refetchInterval: 5_000,
  });

export const useTossPriceLimits = (symbol: string | null) =>
  useQuery({
    queryKey: stockKeys.priceLimits(symbol ?? ""),
    queryFn: () => stockApi.getPriceLimits(symbol!),
    enabled: !!symbol,
    ...COMMON,
  });

export const useTossStockInfo = (symbols: string[]) =>
  useQuery({
    queryKey: stockKeys.stockInfo(symbols),
    queryFn: () => stockApi.getStocks(symbols),
    enabled: symbols.length > 0,
    ...COMMON,
    staleTime: 5 * 60_000,
  });

export const useTossCandles = (
  symbol: string | null,
  interval: "1m" | "1d",
  count?: number,
) =>
  useQuery({
    queryKey: stockKeys.candles(symbol ?? "", `${interval}:${count ?? ""}`),
    queryFn: () =>
      stockApi.getCandles(symbol!, interval, count ? { count } : undefined),
    enabled: !!symbol,
    ...COMMON,
    // 일별표·등락률 계산용 캔들도 주기 갱신 — 1m 은 15초, 1d 는 60초.
    refetchInterval: interval === "1m" ? 15_000 : 60_000,
  });

export const useTossStockWarnings = (symbol: string | null) =>
  useQuery({
    queryKey: stockKeys.warnings(symbol ?? ""),
    queryFn: () => stockApi.getStockWarnings(symbol!),
    enabled: !!symbol,
    ...COMMON,
    staleTime: 5 * 60_000,
  });

export const useTossMarketCalendarKr = () =>
  useQuery({
    queryKey: stockKeys.marketCalendar("KR"),
    queryFn: () => stockApi.getMarketCalendarKr(),
    ...COMMON,
    staleTime: 5 * 60_000,
  });

export const useTossMarketCalendarUs = () =>
  useQuery({
    queryKey: stockKeys.marketCalendar("US"),
    queryFn: () => stockApi.getMarketCalendarUs(),
    ...COMMON,
    staleTime: 5 * 60_000,
  });

export const useTossAccounts = () =>
  useQuery({
    queryKey: stockKeys.accounts(),
    queryFn: () => stockApi.getAccounts(),
    ...COMMON,
    staleTime: 5 * 60_000,
  });

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
  });

// ---- 랭킹 / 시장 지표 / 전일종가 --------------------------------------------

/** 주식 랭킹 (발견 탭). 등락률·거래대금 포함이라 별도 시세 조회가 필요 없다. */
export const useTossRankings = (
  type: TossRankingType,
  marketCountry: "KR" | "US",
  duration: TossRankingDuration,
  opts?: { count?: number; enabled?: boolean },
) =>
  useQuery({
    queryKey: stockKeys.rankings(type, marketCountry, duration),
    queryFn: () =>
      stockApi.getRankings(type, marketCountry, duration, {
        count: opts?.count ?? 20,
      }),
    enabled: opts?.enabled ?? true,
    ...COMMON,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

/** 시장 지표 현재가 (코스피·코스닥 지수 등 토스 카탈로그 8종) */
export const useTossIndicatorPrices = (symbols: string[], enabled = true) =>
  useQuery({
    queryKey: stockKeys.indicators(symbols),
    queryFn: () => stockApi.getIndicatorPrices(symbols),
    enabled: enabled && symbols.length > 0,
    ...COMMON,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

/**
 * 시장 지표 캔들 — 상단 지수 타일의 추이선(스파크라인).
 *
 * **지수 수만큼만 호출이 나간다**(코스피·코스닥 = 2콜). 종목 수에 비례하지 않으므로
 * 유량과 무관하다. 지수는 하루 안에서만 움직이므로 1분봉을 받고, 캐시는 폴링 주기보다
 * 길게 잡아 탭을 오가도 재요청이 안 나가게 한다.
 *
 * 실패해도 화면은 멀쩡하다 — 타일은 숫자만 남고 추이선만 사라진다(`retry: false`).
 */
export const useTossIndicatorCandles = (symbols: string[], enabled = true) => {
  const results = useQueries({
    queries: symbols.map((symbol) => ({
      queryKey: ["toss", "indicator-candles", symbol],
      queryFn: () =>
        stockApi.getIndicatorCandles(symbol, "1m" as const, SPARKLINE_POINTS),
      enabled: enabled && !!symbol,
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 60_000,
    })),
  });
  return useMemo(() => {
    const map = new Map<string, number[]>();
    results.forEach((r, i) => {
      const sym = symbols[i];
      if (!sym || !r.data) return;
      // 오름차순(과거→현재)으로 세워야 선이 왼쪽에서 오른쪽으로 흐른다.
      const closes = [...r.data]
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
        .map((c) => Number.parseFloat(c.closePrice))
        .filter(Number.isFinite);
      // 점이 하나뿐이면 선이 아니라 점이다 — 그릴 게 없으므로 넣지 않는다.
      if (closes.length >= 2) map.set(sym, closes);
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.map((r) => r.dataUpdatedAt).join(","), symbols.join(",")]);
};

/** 스파크라인 한 줄에 쓸 봉 수. 촘촘할수록 선이 자글거리고 적으면 추세가 안 보인다. */
const SPARKLINE_POINTS = 60;

/**
 * 전일 종가. 토스 /prices 에는 기준가·등락률이 없어 일봉 2개로 도출한다.
 * 오늘 날짜 캔들을 제외한 마지막 종가 = 전일 종가 (장 시작 전이면 마지막 캔들이 곧 전일).
 * 하루에 한 번 바뀌는 값이라 길게 캐시한다.
 *
 * '오늘' 은 로컬 날짜를 쓴다([todayLocalKey]) — 앱(`stocks_providers.dart:48`)이 쓰는 기준과
 * 같게 맞춘 것이다. 예전에는 `new Date().toISOString().slice(0, 10)`(UTC)이라 KST 00:00~09:00
 * 동안 앱과 웹이 서로 다른 전일 종가를 집었고, 그 값이 등락률(돈 숫자)로 화면에 나갔다.
 *
 * ⚠️ **캔들 `timestamp` 의 시간대는 확인되지 않았다.** 백엔드는 이 값을 가공하지 않고
 * upstream 토스 응답을 그대로 흘린다(`TossMarketDto.Candle.timestamp` 는 raw `String` 이고
 * 매핑·픽스처가 없다). 거래소 벽시계(KST)라면 지금이 맞지만, `Z`·오프셋이 붙어 온다면
 * `slice(0, 10)` 이 UTC 날짜를 내므로 로컬 '오늘' 과 맞대는 게 또 다른 미스매치가 된다.
 * **실제 응답 한 건으로 형식을 확인한 뒤 이 주석을 근거로 바꿔라** — 앱도 같은 가정 위에 있다.
 */
export const usePrevClose = (symbol: string | null) =>
  useQuery({
    queryKey: stockKeys.prevClose(symbol ?? ""),
    queryFn: async () => {
      const page = await stockApi.getCandles(symbol!, "1d", { count: 3 });
      const candles = page.candles;
      if (candles.length === 0) return null;
      const today = todayLocalKey();
      // 캔들은 최신이 마지막 — 오늘 봉을 빼고 남는 마지막 봉이 전일이다.
      const prev = [...candles]
        .reverse()
        .find((c) => c.timestamp.slice(0, 10) !== today);
      const v = Number.parseFloat((prev ?? candles[0]!).closePrice);
      return Number.isFinite(v) ? v : null;
    },
    enabled: !!symbol,
    ...COMMON,
    staleTime: 10 * 60_000,
  });

/**
 * 여러 심볼의 전일 종가 배치 조회 — 투자 자산 보유 종목 등락 계산용.
 * usePrevClose 와 동일 쿼리키를 공유해 상세 화면과 캐시가 겹친다.
 */
export const usePrevCloses = (symbols: string[]): Map<string, number> => {
  const results = useQueries({
    queries: symbols.map((symbol) => ({
      queryKey: stockKeys.prevClose(symbol),
      queryFn: async () => {
        const page = await stockApi.getCandles(symbol, "1d", { count: 3 });
        const candles = page.candles;
        if (candles.length === 0) return null;
        // usePrevClose 와 같은 이유로 로컬 날짜다 — UTC 면 KST 새벽에 그제 종가를 집는다.
        const today = todayLocalKey();
        const prev = [...candles]
          .reverse()
          .find((c) => c.timestamp.slice(0, 10) !== today);
        const v = Number.parseFloat((prev ?? candles[0]!).closePrice);
        return Number.isFinite(v) ? v : null;
      },
      ...COMMON,
      staleTime: 10 * 60_000,
    })),
  });
  const map = new Map<string, number>();
  results.forEach((r, i) => {
    const sym = symbols[i];
    if (sym && r.data != null) map.set(sym, r.data);
  });
  return map;
};

/** lastPrice 와 전일종가로 등락률(%)을 계산한다. 어느 한쪽이 없으면 null. */
export function changePctOf(
  lastPrice: string | number | null | undefined,
  prevClose: number | null | undefined,
): number | null {
  if (lastPrice == null || prevClose == null || prevClose <= 0) return null;
  const last =
    typeof lastPrice === "number" ? lastPrice : Number.parseFloat(lastPrice);
  if (!Number.isFinite(last)) return null;
  return ((last - prevClose) / prevClose) * 100;
}
