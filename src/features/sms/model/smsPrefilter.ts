/**
 * 결제 문자로 보이는가 — 서버로 보내기 전의 로컬 게이트.
 *
 * 서버 `SmsParser.looksLikePayment`·앱 `looksLikePaymentSms` 와 같은 규칙이다.
 * 정확도가 아니라 **프라이버시**가 목적이다 — 사용자가 실수로 붙여넣은 아무 텍스트가
 * 서버로 올라가면 안 된다. 애매하면 통과시키고 서버가 다시 판단한다.
 */
export function looksLikePaymentSms(text: string | null | undefined): boolean {
  if (!text || !text.trim()) return false
  if (!AMOUNT_PATTERN.test(text)) return false
  return PAYMENT_KEYWORDS.some((k) => text.includes(k))
}

const AMOUNT_PATTERN = /[0-9][0-9,]{0,15}\s*원/
const PAYMENT_KEYWORDS = ['승인', '취소', '결제', '출금', '사용']
