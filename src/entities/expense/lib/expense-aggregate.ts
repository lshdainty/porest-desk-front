import { isScheduledDate } from "@/shared/lib/porest/ledger-format";
import type { Expense } from "../model/types";

/*
 * 거래 집계의 단 하나의 규칙 — 백엔드 `ExpenseAggregates` 미러.
 *
 * 두 가지를 지켜야 서버 값과 맞는다.
 *   1) 아직 오지 않은 건 안 센다. 반복거래는 미래분을 미리 만들어 두는데, 그걸 더하면
 *      통장에 없는 급여가 이번 달 수입으로 잡힌다.
 *   2) 환불된 건 안 센다. 환불은 원거래에 찍는 표식이고, 표식이 찍힌 거래는 삭제와
 *      똑같이 빠진다 — 지출 50,000 을 환불하면 그 달 지출에서 50,000 이 사라진다.
 *   3) 카드 이월은 안 센다. 카드를 만들 때 적은 "이전 미결제 사용액" 은 앱을 쓰기 전에
 *      이미 쓴 돈이라 등록한 달의 지출이 아니다.
 *
 * 여기 있는 합계는 전부 **가계부 숫자**다. 카드 청구·한도 사용은 서버가 내려 주고 그쪽은
 * 이월을 포함한다 — 빼면 "잔액 = 거래 합"(D4)이 풀린다.
 *
 * 이 규칙이 화면마다 흩어져 있어서 실제로 여러 번 빠뜨렸다 — 예산 이행률 차트, 통계 일별
 * 추이, 캘린더 셀이 각각 다른 시점에 발견됐다. 그래서 한곳에 모은다.
 * 거래를 합산하는 코드는 여기를 거칠 것.
 */

/**
 * 아직 오지 않은 거래인가 — 서버도 이 기준으로 오늘까지만 센다.
 *
 * 판정은 `isScheduledDate` 하나다. 예전엔 이 파일과 거래 행이 같은 식을 따로
 * 갖고 있었다 — 합계와 행의 흐린 표시가 어긋날 수 있는 구조였다.
 */
export const isScheduledTx = isScheduledDate;

/** 환불된 거래인가 — 원거래에 찍힌 표식 하나로 판정한다. */
export function isRefundedTx(e: Expense): boolean {
  return e.refundedAt != null;
}

/**
 * 카드 이월 거래인가 — 카드를 만들 때 적은 "이전 미결제 사용액"(D4).
 *
 * 등록 전에 이미 쓴 돈이라 그 달의 지출이 아니다. 목록에는 보이고(자동 생성이라 수정·삭제는
 * 잠겨 있다) 합계에서만 빠진다.
 */
export function isCardCarryoverTx(e: Expense): boolean {
  return e.autoSource === "CARD_CARRYOVER";
}

/**
 * 집계 대상만 남긴다 — 아직 안 온 것과 **환불된 것**을 뺀다.
 *
 * 환불은 원거래에 찍는 표식이라 삭제와 똑같이 빠진다. 종전엔 수입 행을 만들어 음수로
 * 상계했는데, 그러면 환불 날짜 회차에서 또 빠져 카드 청구가 두 번 깎였다.
 */
export function countableTx(all: Expense[]): Expense[] {
  return all.filter(
    (e) =>
      !isScheduledTx(e.expenseDate) &&
      !isRefundedTx(e) &&
      !isCardCarryoverTx(e),
  );
}

/** 수입 합계. */
export function incomeSum(all: Expense[]): number {
  return countableTx(all)
    .filter((e) => e.expenseType === "INCOME")
    .reduce((s, e) => s + Math.abs(e.amount), 0);
}

/** 지출 합계. */
export function expenseSum(all: Expense[]): number {
  return countableTx(all)
    .filter((e) => e.expenseType === "EXPENSE")
    .reduce((s, e) => s + Math.abs(e.amount), 0);
}
