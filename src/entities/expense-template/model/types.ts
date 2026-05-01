import type { ExpenseType, YNType } from '@/entities/expense'

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
  /** 'Y' = 고정 금액 사용, 'N' = 불러올 때 금액 비움 */
  lockAmount: YNType
  /** 마지막 사용 시각 (ISO). 한 번도 안 썼으면 null */
  lastUsedAt: string | null
  createAt: string
  modifyAt: string
}

export interface ExpenseTemplateFormValues {
  templateName: string
  categoryRowId: number | null
  assetRowId?: number | null
  expenseType: ExpenseType
  amount?: number | null
  description?: string
  merchant?: string
  paymentMethod?: string
  sortOrder?: number
  lockAmount: YNType
}
