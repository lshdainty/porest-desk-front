const pad2 = (n: number) => String(n).padStart(2, "0");

/** `yyyy-MM` 에서 `delta` 달 옮긴 `yyyy-MM`. */
function shiftMonth(yearMonth: string, delta: number): string {
  const y = Number(yearMonth.slice(0, 4));
  const idx = Number(yearMonth.slice(5, 7)) - 1 + delta;
  const ny = y + Math.floor(idx / 12);
  const nm = (((idx % 12) + 12) % 12) + 1;
  return `${ny}-${pad2(nm)}`;
}

/** `yyyy-MM` 달의 말일 `yyyy-MM-dd`. */
function monthEnd(yearMonth: string): string {
  const y = Number(yearMonth.slice(0, 4));
  const m = Number(yearMonth.slice(5, 7));
  return `${yearMonth}-${pad2(new Date(y, m, 0).getDate())}`;
}

/**
 * 카드 회차 — 거래 날짜가 속한 회차(그 달 1일~말일)의 결제일.
 *
 * 결제일은 **다음 달**의 결제일이고, 그 달에 없는 날이면 말일이다(서버 `CardCycleMath` 와
 * 같은 규칙). 고쳐 쓰기 확인창의 "{날짜} 결제에 청구돼요" 가 쓴다(계약 10).
 *
 * @param dateKey    거래 날짜 `yyyy-MM-dd`
 * @param paymentDay 카드 결제일(1~31)
 * @returns 그 회차의 결제일 `yyyy-MM-dd`
 */
export function cardCyclePaymentDate(
  dateKey: string,
  paymentDay: number,
): string {
  const next = shiftMonth(dateKey.slice(0, 7), 1);
  const last = Number(monthEnd(next).slice(8, 10));
  return `${next}-${pad2(Math.min(paymentDay, last))}`;
}

/**
 * 결제가 끝난 회차에 걸린 정도.
 *
 * - `closed` — 통째로 닫힌 회차다. 기록만 바뀌고 계좌 잔액은 그대로다(D1).
 * - `partial` — 할부가 닫힌 회차와 열린 회차에 걸쳤다. 지난 회차분만 기록으로 남는다.
 */
export type ClosedCycleSpan = "closed" | "partial";

/**
 * 거래가 결제가 끝난(닫힌) 회차에 드는가.
 *
 * 서버가 자산 응답에 내려 주는 `cardClosedThrough`(이 날짜 이하 거래는 닫힌 회차)와 날짜만
 * 견준다 — 회차를 여기서 다시 세지 않는다. 결제일을 바꾼 카드는 회차마다 적용된 결제일이
 * 다르고(D5), 판정 시계도 서울이라(D11) 화면이 따로 세면 서버와 갈린다. 서버 조회는 없다.
 *
 * `cardClosedThrough` 는 늘 회차 말일이라 "거래 날짜 ≤ 그 값" 이 곧 "첫 회차가 닫혔다" 다.
 * 할부는 마지막 회차 말일까지 닫혔는지를 한 번 더 본다.
 *
 * @param dateKey           거래 날짜 `yyyy-MM-dd`(뒤에 시각이 붙어도 된다)
 * @param installmentMonths 할부 개월(null·1 = 일시불)
 * @param closedThrough     카드 자산의 `cardClosedThrough` — 신용카드가 아니면 null
 */
export function closedCycleSpan(
  dateKey: string,
  installmentMonths: number | null | undefined,
  closedThrough: string | null | undefined,
): ClosedCycleSpan | null {
  if (!closedThrough) return null;
  const day = dateKey.slice(0, 10);
  if (day.length < 10 || day > closedThrough) return null;
  const months =
    installmentMonths != null && installmentMonths > 1 ? installmentMonths : 1;
  if (months > 1) {
    const lastCycleEnd = monthEnd(shiftMonth(day.slice(0, 7), months - 1));
    if (lastCycleEnd > closedThrough) return "partial";
  }
  return "closed";
}

/**
 * 결제일을 바꿔도 **옛 결제일로 결제되는 회차**(D5 — 바꾼 결제일은 다음 회차부터).
 *
 * 닫힌 회차가 있으면 그 다음 달 회차다(계약 10). 없으면 오늘 기준으로 결제일이 아직 안
 * 온 가장 이른 회차다 — 결제일 당일부터는 닫힌 회차라(D2) "오늘보다 뒤" 로 가른다.
 *
 * @param oldPaymentDay 바꾸기 전 결제일
 * @param closedThrough 카드 자산의 `cardClosedThrough`
 * @param todayKey      오늘 `yyyy-MM-dd`
 * @returns 그 회차의 달 `yyyy-MM` 과 옛 결제일 `yyyy-MM-dd`
 */
export function pendingCycleOnOldDay(
  oldPaymentDay: number,
  closedThrough: string | null | undefined,
  todayKey: string,
): { month: string; paymentDate: string } {
  let month: string;
  if (closedThrough) {
    month = shiftMonth(closedThrough.slice(0, 7), 1);
  } else {
    const prev = shiftMonth(todayKey.slice(0, 7), -1);
    month =
      cardCyclePaymentDate(`${prev}-01`, oldPaymentDay) > todayKey
        ? prev
        : todayKey.slice(0, 7);
  }
  return {
    month,
    paymentDate: cardCyclePaymentDate(`${month}-01`, oldPaymentDay),
  };
}
