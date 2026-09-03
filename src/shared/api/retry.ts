import { isAxiosError } from "axios";

/**
 * React Query 전역 재시도 판정.
 *
 * 종전엔 `retry: 1` 이었다. v5 에서 그건 "실패하면 한 번 더" 라는 뜻이라 **모든** 실패가
 * 요청 두 건이 된다 — 없는 자산을 열면 `GET /asset/999999` 가 404 로 두 번 나갔다(QA #4).
 * 토스트가 하나만 보여 눈치채기 어려웠는데, `base.ts` 의 3초 throttle 이 두 번째를
 * 삼키기 때문이다.
 *
 * 4xx 는 다시 물어도 같은 답이다 — 없는 것은 여전히 없고, 권한은 여전히 없다. 재시도가
 * 의미 있는 건 서버가 잠깐 흔들렸거나(5xx) 네트워크가 끊겼을 때뿐이라 그 둘만 남긴다.
 */
export function retryOnlyServerErrors(
  failureCount: number,
  error: unknown,
): boolean {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  if (status != null && status >= 400 && status < 500) return false;
  return failureCount < 1;
}
