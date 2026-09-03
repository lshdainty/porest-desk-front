/**
 * 원화 금액 입력 정리.
 *
 * 금액 칸은 정수(원)만 받는다. 종전엔 숫자 이외 문자를 전부 지워서 `1000.5` 가
 * `10005` 로 10배 넘게 부풀려 저장됐다(QA 2026-09-02) — 소수점은 "지우는" 게 아니라
 * "그 뒤를 버리는" 게 맞다. 부호는 지출·수입 종류가 정하므로 여기서도 버린다.
 */

/** 거래 한 건에 허용하는 최대 금액(100억원). 0 을 몇 개 더 찍는 오타를 막는다. */
export const MAX_AMOUNT = 10_000_000_000;

/**
 * 계좌 잔액·한도 상한(1,000억원). 거래 100억과 **별개다**(QA #17 사용자 확정) —
 * 잔액은 예금 원금·대출 원금이라 거래 한 건보다 자리수가 크다.
 */
export const MAX_BALANCE = 100_000_000_000;

/**
 * 입력 문자열 → 자릿수만 남긴 문자열(소수점 이하 절사, 선행 0 제거, `max` 로 클램프).
 *
 * 예전엔 `slice(0, 11)` 로 **자리수만** 잘라 안내는 "100억까지" 인데 999억이 타이핑됐다
 * (QA #12). 자리수가 아니라 값으로 막는다 — 12자리를 붙여넣어도 상한으로 떨어진다.
 * 선행 0 제거는 기본값 `0` 이 남아 `0500` 이 되던 잔액 칸(QA #18)까지 같이 덮는다.
 */
export function sanitizeAmountInput(
  raw: string,
  max: number = MAX_AMOUNT,
): string {
  const head = raw.split(".")[0] ?? "";
  const digits = head.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "");
  if (!digits) return "";
  return Number(digits) > max ? String(max) : digits;
}

/**
 * 입력 문자열 → 정수 금액. 비어 있으면 0.
 *
 * **클램프하지 않는다.** 상한 판정은 호출부의 몫이다 — 여기서 100억으로 깎으면
 * `parseAmount(x) > MAX_AMOUNT` 같은 게이트가 영원히 거짓이 된다. 실제로 거래 시트의
 * 외화 자동 환산(`setAmount(String(Math.round(원금 × 환율)))`)은 sanitize 를 거치지
 * 않는 유일한 경로라, 그 게이트가 죽으면 100억 초과 금액이 그대로 서버로 나간다.
 */
export function parseAmount(raw: string): number {
  const head = raw.split(".")[0] ?? "";
  return Number(head.replace(/[^0-9]/g, "")) || 0;
}

/**
 * 원화 칸 keystroke 가드 — 숫자가 아닌 한 글자(`.` `-` `e` `+` 공백)를 아예 못 찍게 한다.
 *
 * `sanitizeAmountInput` 이 어차피 지우지만, 지워지는 걸 보고 나서야 아는 것과
 * 애초에 안 찍히는 건 다르다(QA #10 은 '타이핑 자체를 막을 것', #47·#52·#54 의
 * '음수 차단' 도 같은 자리다 — sanitize 는 부호를 조용히 삼켜 절대값으로 바꿔 버린다).
 *
 * 붙여넣기·IME 는 막지 않는다 — `sanitizeAmountInput` 이 그물이다. 안드로이드 소프트
 * 키보드는 `key: "Unidentified"` 로 와서 여기서 못 거른다(그래서 그물이 필요하다).
 *
 * **외화 금액·환율·보유 수량·비율 칸에는 붙이지 마라** — 거기선 `.` 가 유효하다.
 *
 * React 를 import 하지 않으려고 구조적 타입으로 받는다(shared 계층 경계 유지).
 */
export function blockNonDigitKey(e: {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  preventDefault: () => void;
}): void {
  if (e.ctrlKey || e.metaKey || e.altKey) return; // Ctrl+V·Ctrl+A 통과
  if (e.key.length !== 1) return; // Backspace·Tab·화살표·IME 통과
  if (!/[0-9]/.test(e.key)) e.preventDefault();
}
