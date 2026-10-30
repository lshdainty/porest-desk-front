import { useQuery } from "@tanstack/react-query";
import { securitiesApi, type CandleBroker } from "../api/securitiesApi";

/**
 * 일별 표가 쓰는 일봉. 하루에 한 번 바뀌는 값이라 길게 캐시한다.
 * **그 탭의 증권사**로 부른다(I-13b 16) — 토스 탭은 `/v1/toss/candles`, 나무 탭은 `/v1/namu/candles`.
 *
 * 252봉(≈1년)을 받아 최근 9봉만 쓰는 이유 — 차트의 1년 탭과 **같은 요청**이라 캐시가
 * 겹친다. 표만을 위해 더 짧게 부르면 요청이 하나 더 는다.
 *
 * `enabled` — 나무 상세는 상세 시세 질의가 끝난 뒤에 연다(나무 초당 5회 한도에 처음 한꺼번에 몰리지 않게).
 */
export function useDailyCandles(
  symbol: string | null,
  broker: CandleBroker,
  enabled = true,
) {
  return useQuery({
    queryKey: ["securities", "candles", broker, symbol, "1d", 252],
    queryFn: () =>
      securitiesApi.getCandles(symbol!, "1d", { count: 252, broker }),
    enabled: !!symbol && enabled,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60_000,
  });
}
