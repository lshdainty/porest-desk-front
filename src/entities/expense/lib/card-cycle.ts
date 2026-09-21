/**
 * 카드 회차 — 거래 날짜가 속한 회차(그 달 1일~말일)의 결제일.
 *
 * 결제일은 **다음 달**의 결제일이고, 그 달에 없는 날이면 말일이다(서버 `CardCycleMath` 와
 * 같은 규칙). 저장 확인창이 서버에 물어볼지 가르는 데만 쓴다 — 돈을 얼마 움직일지는
 * 서버만 안다.
 *
 * @param dateKey    거래 날짜 `yyyy-MM-dd`
 * @param paymentDay 카드 결제일(1~31)
 * @returns 그 회차의 결제일 `yyyy-MM-dd`
 */
export function cardCyclePaymentDate(
  dateKey: string,
  paymentDay: number,
): string {
  const y = Number(dateKey.slice(0, 4));
  const m = Number(dateKey.slice(5, 7));
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  const last = new Date(ny, nm, 0).getDate();
  const pad2 = (n: number) => String(n).padStart(2, "0");
  return `${ny}-${pad2(nm)}-${pad2(Math.min(paymentDay, last))}`;
}

/**
 * 그 회차의 결제일이 이미 왔는가(당일 포함) — 닫힌 회차(기록만)거나 결제일 당일(그 자리 결제)
 * 이라 저장 전에 한 번 물어야 하는 자리다(닫힌 회차 규칙 R1·R2·R3).
 */
export function isCardCycleDue(
  dateKey: string,
  paymentDay: number,
  todayKey: string,
): boolean {
  return cardCyclePaymentDate(dateKey, paymentDay) <= todayKey;
}
