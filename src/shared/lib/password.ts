/**
 * 비밀번호 규칙 — SSO 서버 정책과 1:1.
 *   @Size(min = 8)                        → length
 *   @Pattern(^(?=.*[^a-zA-Z0-9]).+$)      → special
 *
 * desk 백엔드의 비밀번호 변경은 SSO 로 위임되므로 정책이 동일하다.
 * 입력 중 체크리스트와 폼 검증(zod)이 이 소스를 함께 쓰기 때문에 표시와 실제
 * 검증 결과가 어긋나지 않는다.
 */
export interface PasswordRule {
  /** i18n 라벨 키 (user 네임스페이스) */
  key: 'passwordRuleLength' | 'passwordRuleSpecial'
  test: (value: string) => boolean
}

export const PASSWORD_RULES: readonly PasswordRule[] = [
  { key: 'passwordRuleLength', test: (v) => v.length >= 8 },
  { key: 'passwordRuleSpecial', test: (v) => /[^a-zA-Z0-9]/.test(v) },
]

/** 모든 규칙 충족 여부 */
export const isPasswordValid = (value: string): boolean =>
  PASSWORD_RULES.every((rule) => rule.test(value))
