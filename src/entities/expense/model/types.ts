export type ExpenseType = 'INCOME' | 'EXPENSE'
export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER'

export interface ExpenseCategory {
  rowId: number
  categoryName: string
  icon: string | null
  color: string | null
  expenseType: ExpenseType
  sortOrder: number
  createAt: string
  modifyAt: string
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
  expenseDate: string
  merchant?: string
  paymentMethod?: string
  calendarEventRowId?: number
  todoRowId?: number
}

export interface ExpenseCategoryFormValues {
  categoryName: string
  icon?: string
  color?: string
  expenseType: ExpenseType
}

export interface ExpenseBudget {
  rowId: number
  categoryRowId: number | null
  budgetAmount: number
  budgetYear: number
  budgetMonth: number
  createAt: string
}

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

export interface MonthlySummary {
  year: number
  month: number
  totalIncome: number
  totalExpense: number
  categoryBreakdown: CategoryBreakdown[]
}

export interface CategoryBreakdown {
  categoryRowId: number
  categoryName: string
  totalAmount: number
}

export interface WeeklySummary {
  weekStart: string
  weekEnd: string
  totalIncome: number
  totalExpense: number
}

export interface YearlySummary {
  year: number
  totalIncome: number
  totalExpense: number
  monthlyAmounts: MonthlyAmount[]
}

export interface MonthlyAmount {
  month: number
  totalIncome: number
  totalExpense: number
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
