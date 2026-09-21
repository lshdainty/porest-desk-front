import type { ExpenseSplitFormValue } from "@/entities/expense-split";

export type ExpenseType = "INCOME" | "EXPENSE";

/**
 * 반복 거래·프리셋이 가리키는 거래 종류.
 *
 * `ExpenseType` 에 `TRANSFER` 를 끼우지 않는다 — 그 값은 거래·통계·예산이 전부 지나는
 * 자리라, 이체를 넣으면 그 셋이 모두 "이체를 어느 쪽으로 셀 것인가" 를 답해야 한다.
 * 이체는 지출/수입 어느 쪽으로도 집계되면 안 되는 값이다. 서버도 같은 이유로
 * `ExpenseType` 을 그대로 두고 `TxKind` 를 따로 뒀다.
 */
export type TxKind = ExpenseType | "TRANSFER";
export type PaymentMethod = "CASH" | "CARD" | "TRANSFER" | "OTHER";

export interface ExpenseCategory {
  rowId: number;
  categoryName: string;
  icon: string | null;
  color: string | null;
  expenseType: ExpenseType;
  sortOrder: number;
  parentRowId: number | null;
  hasChildren: boolean;
  createAt: string;
  modifyAt: string;
}

export interface ExpenseCategoryTreeNode extends ExpenseCategory {
  children: ExpenseCategoryTreeNode[];
}

export interface Expense {
  rowId: number;
  categoryRowId: number;
  categoryName?: string;
  categoryColor?: string;
  categoryIcon?: string;
  assetRowId: number | null;
  assetName: string | null;
  expenseType: ExpenseType;
  amount: number;
  description: string | null;
  /** ISO-LOCAL-DATETIME (YYYY-MM-DDTHH:mm:ss). 10자 "YYYY-MM-DD" 도 호환됨. */
  expenseDate: string;
  merchant: string | null;
  paymentMethod: string | null;
  /** 할부 개월 (null = 일시불). 신용카드 결제에만 의미. */
  installmentMonths: number | null;
  /**
   * 환불 처리 시각 (null = 환불 아님).
   *
   * 환불은 **원거래에 찍는 표식**이다 — 수입 행을 만들지 않는다. 있으면 합계·예산·통계·
   * 청구·실적에서 삭제와 똑같이 빠지고, 목록·검색·상세에는 남는다.
   */
  refundedAt: string | null;
  /** 환불 마크가 만든 카드→결제계좌 환급 이체 (null = 없음). */
  refundTransferRowId: number | null;
  /**
   * 이 저장이 **방금 만든** 카드 환급액 (없으면 없음) — 거래의 속성이 아니라 그 요청의
   * 결과다. 조회로 받은 거래에는 늘 없다(설계 13-1).
   */
  refundedAmount?: number | null;
  /**
   * 이 날짜(회차 말일)까지의 카드 회차분은 계좌 이체 없이 정리된 **기록용** (null = 정상).
   *
   * 결제가 끝난(닫힌) 회차에 뒤늦게 적은 카드 지출에 붙는다 — 가계부 합계에는 들어가지만
   * 계좌에서는 빠지지 않았고 이후 청구에도 안 얹힌다(닫힌 회차 규칙 R2). 옛 서버면 없다.
   */
  cardSettledThrough?: string | null;
  /** 그 가운데 기록만 남긴 금액 — 할부는 지난 회차분만이라 거래 금액보다 작을 수 있다. */
  recordOnlyAmount?: number | null;
  /** 원 통화 금액 (해외 결제). null 이면 원화 결제 */
  originalAmount: number | null;
  /** 원 통화 (ISO 4217, 예: USD) */
  originalCurrency: string | null;
  /** 적용 환율 (원 통화 1단위당 원화) */
  exchangeRate: number | null;
  calendarEventRowId: number | null;
  todoRowId: number | null;
  /**
   * 시스템이 만든 거래의 출처 — `TRADE_REALIZED`(매도 실현손익) / `TRANSFER_INTEREST`(이체 이자).
   * null 이면 손으로 쓴 거래다.
   *
   * <p>값이 있으면 금액·날짜·자산은 계산 결과라 고칠 수 없다. 원본 거래를 지우면 함께 사라진다.
   * 카테고리·메모는 분류라서 그대로 고칠 수 있다.
   */
  autoSource: string | null;
  /** 활성 분할 항목들의 카테고리 id (없으면 빈 배열). 목록 카테고리 필터를 split-aware 하게 매칭. */
  splitCategoryRowIds?: number[];
  createAt: string;
  modifyAt: string;
}

/**
 * 거래 생성·수정 본문.
 *
 * PUT 은 세 갈래다 — **키 없음=유지 · `null`=지움 · 값=교체**(`Patch`, QA #96).
 * 그래서 화면이 그리는 칸은 비었을 때 `null` 을 실어야 지워지고(`undefined` 는 키를
 * 빼는 것이라 옛 값이 남는다), 화면에 없는 칸은 아예 안 실어야 남의 값을 안 덮는다.
 * `?: T | null` 로 적힌 칸이 "지울 수 있는 칸" 이다.
 */
export interface ExpenseFormValues {
  categoryRowId: number;
  /** 결제 계좌·카드. `null` = 연결 해제('선택 안 함'). */
  assetRowId?: number | null;
  expenseType: ExpenseType;
  amount: number;
  /** `null` = 설명 지움. */
  description?: string | null;
  /** ISO-LOCAL-DATETIME (YYYY-MM-DDTHH:mm:ss). 10자 "YYYY-MM-DD" 도 호환됨. */
  expenseDate: string;
  /** `null` = 거래처 지움. */
  merchant?: string | null;
  /** `null` = 결제수단 지움('선택 안 함'). */
  paymentMethod?: string | null;
  /** 할부 개월 (미전달·1 = 일시불). 신용카드 결제에만 의미. */
  installmentMonths?: number | null;
  /** 원 통화 금액 (해외 결제) */
  originalAmount?: number | null;
  /** 원 통화 (ISO 4217) */
  originalCurrency?: string | null;
  /** 적용 환율 */
  exchangeRate?: number | null;
  calendarEventRowId?: number;
  todoRowId?: number;
  /**
   * 분할 내역 동시 수정(선택). 미전달/undefined = 분할 미변경(기존 유지).
   * 전달 시 새 분할로 교체되며, 합이 amount와 같아야 한다(백엔드 원자 검증).
   * 거래 금액을 바꿔 기존 분할 합과 어긋날 때, 맞춘 분할을 함께 보내 일치화하는 용도.
   */
  splits?: ExpenseSplitFormValue[];
}

export interface ExpenseCategoryFormValues {
  categoryName: string;
  icon?: string;
  color?: string;
  expenseType: ExpenseType;
  sortOrder?: number;
  parentRowId?: number | null;
}

export interface ExpenseBudget {
  rowId: number;
  categoryRowId: number | null;
  categoryName: string | null;
  budgetAmount: number;
  budgetYear: number;
  budgetMonth: number;
  createAt: string;
}

export interface ExpenseBudgetFormValues {
  categoryRowId?: number | null;
  budgetAmount: number;
  budgetYear: number;
  budgetMonth: number;
}

export interface RangeSummary {
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpense: number;
  categoryBreakdown: CategoryBreakdown[];
  monthlyBuckets: RangeMonthlyBucket[];
}

export interface RangeMonthlyBucket {
  year: number;
  month: number;
  totalIncome: number;
  totalExpense: number;
  // 그 달의 카테고리별 지출(EXPENSE만, split-aware). 카테고리 월별 추이 차트용.
  // 백엔드 배포 전이거나 데이터 없으면 undefined/빈 배열일 수 있음 — 소비 측에서 안전 처리.
  categoryExpenses?: CategoryAmount[];
}

export interface CategoryAmount {
  categoryRowId: number;
  amount: number;
}

export interface MonthlyTrend {
  year: number;
  month: number;
  totalIncome: number;
  totalExpense: number;
}

export interface BudgetComplianceMonth {
  year: number;
  month: number;
  totalLimit: number;
  totalSpent: number;
  compliancePercent: number;
}

export interface CategoryBreakdown {
  /** null = 미분류 — 카테고리 없이 자동 생성되는 거래(실현손익·대출이자)가 여기 모인다. */
  categoryRowId: number | null;
  categoryName: string | null;
  totalAmount: number;
  parentCategoryRowId: number | null;
  parentCategoryName: string | null;
  expenseType: ExpenseType;
}

export interface ParentCategoryBreakdown {
  categoryRowId: number | null;
  categoryName: string | null;
  totalAmount: number;
  children: CategoryBreakdown[];
}

export type StatsPeriod = "3m" | "6m" | "1y";

export interface BudgetVsActualItem {
  categoryName: string;
  budgetAmount: number;
  actualAmount: number;
  percentage: number;
}

export interface MerchantSummary {
  merchant: string;
  totalAmount: number;
  count: number;
}

export interface HeatmapCell {
  /** Java DayOfWeek 기준: 1=월 ~ 7=일 */
  dayOfWeek: number;
  /** 0-23 */
  hour: number;
  totalAmount: number;
}

/**
 * 카드 정산 미리보기 — 저장·삭제·수정·환불하면 돈이 어떻게 움직이는지(설계 13-1,
 * 닫힌 회차 R2·R3·R6).
 *
 * `applies` 가 false 면 돌려줄 돈이 없다. `reason` 으로 화면이 문구를 고른다:
 * `OK`·`RECORD_ONLY_OK`(금액 줄) · `ALREADY_REFUNDED`("이미 환급된 거래") ·
 * `REFUND_WINDOW_CLOSED`("결제한 달이 지나 기록만 정리돼요") · 나머지(줄 없음).
 */
export interface RefundPreview {
  applies: boolean;
  refundAmount: number;
  reason:
    | "OK"
    | "RECORD_ONLY_OK"
    | "REFUND_WINDOW_CLOSED"
    | "NOT_CARD"
    | "NO_PAYMENT_ASSET"
    | "NOT_PAID_CYCLE"
    | "ALREADY_REFUNDED";
  /** 이번 저장으로 기록만 남는 금액 — 결제가 끝난 회차에 떨어진 몫(R2). 옛 서버면 없다. */
  newRecordAmount?: number;
  /** 오늘이 결제일이라 결제계좌에서 추가로 빠질 금액(R3). 옛 서버면 없다. */
  sameDayExtraPayment?: number;
}

/** 삭제 응답 — 이 삭제가 만든 환급액(없으면 null). */
export interface DeleteExpenseResult {
  refundedAmount: number | null;
}
