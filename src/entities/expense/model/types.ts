import type { ExpenseSplitFormValue } from "@/entities/expense-split";

export type ExpenseType = "INCOME" | "EXPENSE";
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
  /** 환불 원거래 행 아이디 (null = 환불 아님). 수입이면서 이 값이 있으면 지출 상계로 집계. */
  refundOfExpenseRowId: number | null;
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
  /**
   * 이 거래에 달린 환불 건수·합계. 지우면 함께 사라지므로 화면이 미리 알린다.
   * 환불이 없으면 0 이다.
   */
  refundCount: number;
  refundedAmount: number;
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
  /**
   * 환불 원거래 행 아이디. 이 연결이 통계 상계를 만든다(수입으로 부풀지 않는다).
   *
   * **수정에서는 이 키를 싣지 마라.** 연결을 끊는 칸이 어느 화면에도 없는데 `null` 이
   * 나가면 메모만 고쳐도 원거래의 환불 수·환불액이 0 이 된다(QA #108).
   */
  refundOfExpenseRowId?: number | null;
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

export interface DailySummary {
  date: string;
  totalIncome: number;
  totalExpense: number;
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

export interface AssetExpenseSummary {
  assetRowId: number;
  assetName: string;
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
