import type { Expense } from '@/entities/expense'

/*
 * 거래 집계의 단 하나의 규칙 — 백엔드 `ExpenseAggregates` 미러.
 *
 * 두 가지를 지켜야 서버 값과 맞는다.
 *   1) 아직 오지 않은 건 안 센다. 반복거래는 미래분을 미리 만들어 두는데, 그걸 더하면
 *      통장에 없는 급여가 이번 달 수입으로 잡힌다.
 *   2) 환불은 수입이 아니라 지출 상계다. 지출 50,000 + 환불 3,000 이면 47,000 이다.
 *
 * 이 규칙이 화면마다 흩어져 있어서 실제로 여러 번 빠뜨렸다 — 예산 이행률 차트, 통계 일별
 * 추이, 캘린더 셀이 각각 다른 시점에 발견됐다. 그래서 한곳에 모은다.
 * 거래를 합산하는 코드는 여기를 거칠 것.
 */

/** 아직 오지 않은 거래인가 — 서버도 이 기준으로 오늘까지만 센다. */
export function isScheduledTx(date: string | null | undefined): boolean {
  if (!date) return false
  return new Date(date.length === 10 ? `${date}T23:59:59` : date) > new Date()
}

/** 환불 = 수입으로 기록하되 원거래에 묶인 것. 수입이 아니라 지출을 깎는다. */
export function isRefundTx(e: Expense): boolean {
  return e.expenseType === 'INCOME' && e.refundOfExpenseRowId != null
}

/** 집계 대상만 남긴다. */
export function countableTx(all: Expense[]): Expense[] {
  return all.filter(e => !isScheduledTx(e.expenseDate))
}

/** 수입 합계 — 환불 제외. */
export function incomeSum(all: Expense[]): number {
  return countableTx(all)
    .filter(e => e.expenseType === 'INCOME' && !isRefundTx(e))
    .reduce((s, e) => s + Math.abs(e.amount), 0)
}

/** 지출 합계 — 환불이 음수로 상계된다. */
export function expenseSum(all: Expense[]): number {
  return countableTx(all).reduce(
    (s, e) =>
      s +
      (isRefundTx(e)
        ? -Math.abs(e.amount)
        : e.expenseType === 'EXPENSE'
          ? Math.abs(e.amount)
          : 0),
    0,
  )
}
