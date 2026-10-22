import { isAxiosError } from "axios";

import { endChain, mayRetryWithinBudget } from "./request-budget";

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
 *
 * 불러오기 요청 제한(skeleton.md "요청 제한 10초 · 다시 시도는 그 안에서") — 시간 제한이 걸린 읽기는 처음 요청부터
 * 합쳐 10초 안에서 2번까지, 1초 · 2초 뒤에 다시 한다(request-budget.ts). 10초를 넘기게 되면 하지 않는다.
 * 제한이 걸리지 않는 읽기(파일 받기 등)는 종전처럼 한 번만 다시 한다.
 */
export function retryOnlyServerErrors(
  failureCount: number,
  error: unknown,
): boolean {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  if (status != null && status >= 400 && status < 500) {
    // 다시 하지 않고 끝난 불러오기 — 기억을 지운다(곧 다시 불러오면 새로 10초)
    endChain(isAxiosError(error) ? error.config : undefined);
    return false;
  }
  const bounded = mayRetryWithinBudget(
    failureCount,
    isAxiosError(error) ? error.config : undefined,
  );
  if (bounded !== undefined) return bounded;
  return failureCount < 1;
}

export { retryDelay } from "./request-budget";
