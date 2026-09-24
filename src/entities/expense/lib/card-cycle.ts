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
 * 카드 회차 — 거래 날짜가 속한 회차(그 달 1일~말일)의 결제일을 **지금 결제일로** 센다.
 *
 * 결제일은 **다음 달**의 결제일이고, 그 달에 없는 날이면 말일이다(서버 `CardCycleMath` 와
 * 같은 규칙). 결제일을 바꾼 직후 아직 결제 전인 회차는 옛 결제일에 결제되므로(D5), 화면이
 * 날짜를 말할 땐 이 값을 바로 쓰지 말고 `cyclePaymentDate` 를 거친다.
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

/** 회차의 달(`yyyy-MM`) — 그 회차의 결제일(`yyyy-MM-dd`)이 든 달의 전달이다. */
function cycleMonthOfPaymentDate(paymentDate: string): string {
  return shiftMonth(paymentDate.slice(0, 7), -1);
}

/**
 * 그 날짜가 든 회차가 **실제로** 결제되는 날(D5).
 *
 * 결제일을 바꾸면 아직 결제 전인 가장 가까운 회차는 옛 결제일에 결제되고 그 다음 회차부터
 * 새 결제일이다. 그 회차의 실제 결제일은 서버가 자산 응답에 `nextPaymentDate` 로 내려 준다
 * (결제일 이력 반영). 날짜가 그 회차(= `nextPaymentDate` 의 전달)에 들면 그 값을, 그 밖의
 * 회차는 지금 결제일로 센다. 지금 결제일로만 세면 결제일 변경이 대기 중인 카드에서
 * 고쳐 쓰기 확인창이 틀린 날을 말했다(QA 26차 4 — 실제 결제는 서버 이력대로 맞았다).
 *
 * @param dateKey         거래 날짜 `yyyy-MM-dd`
 * @param paymentDay      카드의 지금 결제일(1~31)
 * @param nextPaymentDate 카드 자산의 `nextPaymentDate` — 없으면 지금 결제일로만 센다
 */
export function cyclePaymentDate(
  dateKey: string,
  paymentDay: number,
  nextPaymentDate?: string | null,
): string {
  if (
    nextPaymentDate &&
    dateKey.slice(0, 7) === cycleMonthOfPaymentDate(nextPaymentDate)
  ) {
    return nextPaymentDate;
  }
  return cardCyclePaymentDate(dateKey, paymentDay);
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
 * 서버가 그 회차의 실제 결제일을 `nextPaymentDate` 로 내려 주면 그 값과 그 회차의 달을
 * 쓴다 — 결제일을 한 번 바꿔 둔 채 또 바꾸면 그 회차는 지금 결제일이 아니라 처음 결제일에
 * 결제된다(25→21→10 이면 8월분은 9/25). 지금 결제일로 세면 그 자리에서 틀린 날을 말했다
 * (QA 26차 4).
 *
 * 없으면(옛 서버) 스스로 센다 — 닫힌 회차가 있으면 그 다음 달 회차다(계약 10). 없으면 오늘
 * 기준으로 결제일이 아직 안 온 가장 이른 회차다 — 결제일 당일부터는 닫힌 회차라(D2)
 * "오늘보다 뒤" 로 가른다.
 *
 * @param oldPaymentDay   바꾸기 전 결제일
 * @param closedThrough   카드 자산의 `cardClosedThrough`
 * @param todayKey        오늘 `yyyy-MM-dd`
 * @param nextPaymentDate 카드 자산의 `nextPaymentDate`
 * @returns 그 회차의 달 `yyyy-MM` 과 그 회차가 결제되는 날 `yyyy-MM-dd`
 */
export function pendingCycleOnOldDay(
  oldPaymentDay: number,
  closedThrough: string | null | undefined,
  todayKey: string,
  nextPaymentDate?: string | null,
): { month: string; paymentDate: string } {
  if (nextPaymentDate) {
    return {
      month: cycleMonthOfPaymentDate(nextPaymentDate),
      paymentDate: nextPaymentDate,
    };
  }
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

/**
 * 새 카드의 결제 대기 청구분 칸(2026-09-22 사용자 결정).
 *
 * 결제일 전에 카드를 등록하면 실제 카드사는 지난달 청구분을 다가오는 결제일에, 이번 달 쓴
 * 금액을 그다음 결제일에 뺀다. 오늘이 이번 달 결제일(지난달 회차의 결제일) 전이면 그 회차가
 * 결제를 기다린다 — 두 날짜를 준다. 결제일 당일부터는 닫힌 회차라(D2) "오늘보다 뒤" 로 가른다.
 * 결제일이 없거나 이미 지났으면 null(칸 하나 — 종전 그대로).
 *
 * @returns dueDate 청구분이 결제되는 날 · afterDate 그 뒤 쓴 금액이 결제되는 날(`yyyy-MM-dd`)
 */
export function pendingBillWindow(
  todayKey: string,
  paymentDay: number | null | undefined,
): { dueDate: string; afterDate: string } | null {
  if (paymentDay == null || !Number.isFinite(paymentDay) || paymentDay < 1) {
    return null;
  }
  const thisMonth = todayKey.slice(0, 7);
  const dueDate = cardCyclePaymentDate(
    `${shiftMonth(thisMonth, -1)}-01`,
    paymentDay,
  );
  if (dueDate <= todayKey) return null;
  return {
    dueDate,
    afterDate: cardCyclePaymentDate(`${thisMonth}-01`, paymentDay),
  };
}
