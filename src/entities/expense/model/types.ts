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
  expenseType: ExpenseType
  amount: number
  description: string | null
  expenseDate: string
  paymentMethod: string | null
  createAt: string
  modifyAt: string
}

export interface ExpenseFormValues {
  categoryRowId: number
  expenseType: ExpenseType
  amount: number
  description?: string
  expenseDate: string
  paymentMethod?: string
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
