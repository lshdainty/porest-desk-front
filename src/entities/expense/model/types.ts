import type { ExpenseSplitFormValue } from '@/entities/expense-split'

export type ExpenseType = 'INCOME' | 'EXPENSE'
export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER'

export interface ExpenseCategory {
  rowId: number
  categoryName: string
  icon: string | null
  color: string | null
  expenseType: ExpenseType
  sortOrder: number
  parentRowId: number | null
  hasChildren: boolean
  createAt: string
  modifyAt: string
}

export interface ExpenseCategoryTreeNode extends ExpenseCategory {
  children: ExpenseCategoryTreeNode[]
}

export interface Expense {
  rowId: number
  categoryRowId: number
  categoryName?: string
  categoryColor?: string
  categoryIcon?: string
  assetRowId: number | null
  assetName: string | null
  expenseType: ExpenseType
  amount: number
  description: string | null
  /** ISO-LOCAL-DATETIME (YYYY-MM-DDTHH:mm:ss). 10자 "YYYY-MM-DD" 도 호환됨. */
  expenseDate: string
  merchant: string | null
  paymentMethod: string | null
  calendarEventRowId: number | null
  todoRowId: number | null
  createAt: string
  modifyAt: string
}

export interface ExpenseFormValues {
  categoryRowId: number
  assetRowId?: number
  expenseType: ExpenseType
  amount: number
  description?: string
  /** ISO-LOCAL-DATETIME (YYYY-MM-DDTHH:mm:ss). 10자 "YYYY-MM-DD" 도 호환됨. */
  expenseDate: string
  merchant?: string
  paymentMethod?: string
  calendarEventRowId?: number
  todoRowId?: number
  /**
   * 분할 내역 동시 수정(선택). 미전달/undefined = 분할 미변경(기존 유지).
   * 전달 시 새 분할로 교체되며, 합이 amount와 같아야 한다(백엔드 원자 검증).
   * 거래 금액을 바꿔 기존 분할 합과 어긋날 때, 맞춘 분할을 함께 보내 일치화하는 용도.
   */
  splits?: ExpenseSplitFormValue[]
}

export interface ExpenseCategoryFormValues {
  categoryName: string
  icon?: string
  color?: string
  expenseType: ExpenseType
  sortOrder?: number
  parentRowId?: number | null
}

export interface ExpenseBudget {
  rowId: number
  categoryRowId: number | null
  categoryName: string | null
  budgetAmount: number
  budgetYear: number
  budgetMonth: number
  createAt: string
}

export type YNType = 'Y' | 'N'

export interface ExpenseBudgetFormValues {
  categoryRowId?: number | null
  budgetAmount: number
  budgetYear: number
  budgetMonth: number
}

export interface DailySummary {
  date: string
  totalIncome: number
  totalExpense: number
}

export interface RangeSummary {
  startDate: string
  endDate: string
  totalIncome: number
  totalExpense: number
  categoryBreakdown: CategoryBreakdown[]
  monthlyBuckets: RangeMonthlyBucket[]
}

export interface RangeMonthlyBucket {
  year: number
  month: number
  totalIncome: number
  totalExpense: number
}

export interface MonthlyTrend {
  year: number
  month: number
  totalIncome: number
  totalExpense: number
}

export interface BudgetComplianceMonth {
  year: number
  month: number
  totalLimit: number
  totalSpent: number
  compliancePercent: number
}

export interface CategoryBreakdown {
  categoryRowId: number
  categoryName: string
  totalAmount: number
  parentCategoryRowId: number | null
  parentCategoryName: string | null
  expenseType: ExpenseType
}

export interface ParentCategoryBreakdown {
  categoryRowId: number
  categoryName: string
  totalAmount: number
  children: CategoryBreakdown[]
}

export type StatsPeriod = '3m' | '6m' | '1y'

export interface BudgetVsActualItem {
  categoryName: string
  budgetAmount: number
  actualAmount: number
  percentage: number
}

export interface MerchantSummary {
  merchant: string
  totalAmount: number
  count: number
}

export interface AssetExpenseSummary {
  assetRowId: number
  assetName: string
  totalAmount: number
  count: number
}

export interface HeatmapCell {
  /** Java DayOfWeek 기준: 1=월 ~ 7=일 */
  dayOfWeek: number
  /** 0-23 */
  hour: number
  totalAmount: number
}
