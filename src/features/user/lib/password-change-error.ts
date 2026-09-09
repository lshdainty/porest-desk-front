/**
 * 비밀번호 변경 실패 → desk 문구 키.
 *
 * 이 화면의 실패 문구는 **SSO 가 쓴 문장이 그대로 흘러나오고 있었다** — 틀린 현재
 * 비밀번호를 넣으면 `현재 비밀번호가 올바르지 않습니다` 가 떴다(QA #128).
 * desk 는 `~어요` 로 말하는데 SSO 는 `~습니다` 로 말한다. 문장 하나가 아니라
 * **말하는 사람이 바뀐 것**처럼 읽히는 게 문제다.
 *
 * 고치는 자리는 desk 쪽이다(SSO 는 HR·SSO 화면도 함께 쓰므로 여기서 정할 수 없다).
 * 판정은 **문구가 아니라 코드**로 한다 — 문구는 SSO 배포·`Accept-Language` 마다
 * 바뀌므로 문자열을 맞춰 두면 조용히 빗나간다.
 *
 * 코드는 desk-back 이 `code` 로 실어 준다(`ApiResponse.error(code, message)`).
 * `/v1/users/me/password` 의 실패는 전부 `USER_003`
 * (`DeskErrorCode.USER_PASSWORD_CHANGE_FAILED`) 한 코드로 눕는다 — desk-back 이
 * SSO 응답에서 **message 만** 뽑아 다시 던지기 때문에 SSO 의 `PWD_001` 은 여기까지
 * 오지 않는다. 그래서 이 코드는 "왜 실패했는지" 가 아니라 "비밀번호 변경이 실패했다"
 * 까지만 말해 준다.
 *
 * 그래도 이 폼에서 `USER_003` 은 **현재 비밀번호 불일치 하나**다. SSO 가 그 밖에
 * 거절하는 세 가지(새 비밀번호 확인 불일치 · 현재와 동일 · 정책 미달)는 제출 전에
 * 폼이 이미 막고 있고, 정책도 SSO 의 `@Size(min=8)` + `[^a-zA-Z0-9]` 와 같은 규칙
 * (`PASSWORD_RULES`)으로 검사한다. 나머지(네트워크·SSO 장애 등)는 코드가 다르므로
 * 아래 기본값으로 떨어진다.
 */

/** desk-back `DeskErrorCode.USER_PASSWORD_CHANGE_FAILED`. */
export const PASSWORD_CHANGE_FAILED_CODE = "USER_003";

/** `user` 네임스페이스의 문구 키. */
export type PasswordChangeErrorKey =
  "currentPasswordInvalid" | "passwordChangeError";

/**
 * axios 에러에서 desk 문구 키를 뽑는다.
 *
 * `error.message` 는 `Request failed with status code 400` 원문이라 쓰지 않는다.
 * 응답 body 의 `code` 만 본다 — `message` 는 서버가 쓴 문장이므로 화면에 닿게 하지
 * 않는다.
 */
export function passwordChangeErrorKey(err: unknown): PasswordChangeErrorKey {
  const code = (err as { response?: { data?: { code?: unknown } } })?.response
    ?.data?.code;
  return code === PASSWORD_CHANGE_FAILED_CODE
    ? "currentPasswordInvalid"
    : "passwordChangeError";
}
