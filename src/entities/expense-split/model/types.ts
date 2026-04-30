export interface ExpenseSplit {
  rowId: number
  expenseRowId: number
  categoryRowId: number
  categoryName: string
  amount: number
  label: string | null
  sortOrder: number
  createAt: string
  modifyAt: string
}

export interface ExpenseSplitFormValue {
  categoryRowId: number
  amount: number
  label?: string | null
  sortOrder?: number
}
