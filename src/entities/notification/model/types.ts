export type NotificationType = 'EVENT_REMINDER' | 'BUDGET_ALERT' | 'TODO_REMINDER' | 'SYSTEM'
export type ReferenceType = 'CALENDAR_EVENT' | 'EXPENSE_BUDGET' | 'TODO'

export interface Notification {
  rowId: number
  userRowId: number
  notificationType: NotificationType
  title: string
  message: string
  referenceType: ReferenceType | null
  referenceId: number | null
  isRead: boolean
  readAt: string | null
  createAt: string
}
