/**
 * 토큰 교환이 "해지한 계정" 때문에 막혔나.
 *
 * <p>desk-back `TokenExchangeService` 가 해지자의 로그인을 {@code USER_021} 로 끊는다.
 * 이 코드를 못 알아보면 화면은 보통의 로그인 실패로 보고 로그인 페이지로 되돌린다 —
 * 사용자는 왜 안 되는지 모른 채 비밀번호만 다시 넣어 보게 된다.
 *
 * <p>모양으로 판정하지 않고 <b>코드로</b> 본다. 문구는 로케일마다 다르고 서버가 고치면
 * 따라 바뀌지만 코드는 계약이다.
 */
export const USER_WITHDRAWN_CODE = "USER_021";

export function isWithdrawnAccountError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const data = (err as { response?: { data?: { code?: unknown } } }).response
    ?.data;
  return data?.code === USER_WITHDRAWN_CODE;
}
