import { useQuery } from "@tanstack/react-query";
import { securitiesApi } from "../api/securitiesApi";

/**
 * 일별 표가 쓰는 일봉. 하루에 한 번 바뀌는 값이라 길게 캐시한다.
 *
 * 252봉(≈1년)을 받아 최근 9봉만 쓰는 이유 — 차트의 1년 탭과 **같은 요청**이라 캐시가
 * 겹친다. 표만을 위해 더 짧게 부르면 요청이 하나 더 는다.
 */
export function useDailyCandles(symbol: string | null) {
  return useQuery({
    queryKey: ["securities", "candles", symbol, "1d", 252],
    queryFn: () => securitiesApi.getCandles(symbol!, "1d", { count: 252 }),
    enabled: !!symbol,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60_000,
  });
}
