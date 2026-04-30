import type { ExpenseType } from '@/entities/expense'

export type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
export type YNType = 'Y' | 'N'

export interface RecurringTransaction {
  rowId: number
  userRowId: number
  categoryRowId: number | null
  categoryName: string | null
  assetRowId: number | null
  assetName: string | null
  sourceExpenseRowId: number | null
  expenseType: ExpenseType
  amount: number
  description: string | null
  merchant: string | null
  paymentMethod: string | null
  frequency: RecurringFrequency
  intervalValue: number
  dayOfWeek: number | null
  dayOfMonth: number | null
  startDate: string
  endDate: string | null
  nextExecutionDate: string
  lastExecutedAt: string | null
  isActive: YNType
  autoLog: boolean
  notifyDayBefore: boolean
  createAt: string
  modifyAt: string
}

export interface RecurringTransactionFormValues {
  categoryRowId?: number
  assetRowId?: number
  sourceExpenseRowId?: number
  expenseType: ExpenseType
  amount: number
  description?: string
  merchant?: string
  paymentMethod?: string
  frequency: RecurringFrequency
  intervalValue?: number
  dayOfWeek?: number
  dayOfMonth?: number
  startDate: string
  endDate?: string
  autoLog?: boolean
  notifyDayBefore?: boolean
}
