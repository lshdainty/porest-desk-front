/**
 * 원화 금액 입력 정리.
 *
 * 금액 칸은 정수(원)만 받는다. 종전엔 숫자 이외 문자를 전부 지워서 `1000.5` 가
 * `10005` 로 10배 넘게 부풀려 저장됐다(QA 2026-09-02) — 소수점은 "지우는" 게 아니라
 * "그 뒤를 버리는" 게 맞다. 부호는 지출·수입 종류가 정하므로 여기서도 버린다.
 */

/** 거래 한 건에 허용하는 최대 금액(100억원). 0 을 몇 개 더 찍는 오타를 막는다. */
export const MAX_AMOUNT = 10_000_000_000;

/** 입력 문자열 → 자릿수만 남긴 문자열(소수점 이하 절사, 최대 11자리). */
export function sanitizeAmountInput(raw: string): string {
  const head = raw.split(".")[0] ?? "";
  return head.replace(/[^0-9]/g, "").slice(0, 11);
}

/** 입력 문자열 → 정수 금액. 비어 있으면 0. */
export function parseAmount(raw: string): number {
  return Number(sanitizeAmountInput(raw)) || 0;
}
