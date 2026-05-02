export type YNType = 'Y' | 'N'

export interface SavingGoal {
  rowId: number
  userRowId: number
  title: string
  description: string | null
  targetAmount: number
  currentAmount: number
  currency: string
  deadlineDate: string | null
  icon: string | null
  color: string | null
  linkedAssetRowId: number | null
  sortOrder: number
  isAchieved: YNType
  achievedAt: string | null
  createAt: string
  modifyAt: string
}

export interface SavingGoalFormValues {
  title: string
  description?: string
  targetAmount: number
  currency?: string
  deadlineDate?: string | null
  icon?: string | null
  color?: string | null
  linkedAssetRowId?: number | null
  sortOrder?: number
}

export interface SavingGoalUpdateFormValues {
  title: string
  description?: string
  targetAmount: number
  deadlineDate?: string | null
  icon?: string | null
  color?: string | null
  linkedAssetRowId?: number | null
}

export interface SavingGoalContributeValues {
  amount: number
  note?: string
}

export interface SavingGoalReorderItem {
  id: number
  sortOrder: number
}
