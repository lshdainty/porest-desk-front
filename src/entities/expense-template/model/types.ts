import type { ExpenseType } from '@/entities/expense'

export interface ExpenseTemplate {
  rowId: number
  userRowId: number
  templateName: string
  categoryRowId: number | null
  categoryName: string | null
  assetRowId: number | null
  assetName: string | null
  expenseType: ExpenseType
  amount: number | null
  description: string | null
  merchant: string | null
  paymentMethod: string | null
  useCount: number
  sortOrder: number
  createAt: string
  modifyAt: string
}

export interface ExpenseTemplateFormValues {
  templateName: string
  categoryRowId?: number
  assetRowId?: number
  expenseType: ExpenseType
  amount?: number
  description?: string
  merchant?: string
  paymentMethod?: string
  sortOrder?: number
}

export interface ExpenseTemplateUseValues {
  expenseDate: string
}
