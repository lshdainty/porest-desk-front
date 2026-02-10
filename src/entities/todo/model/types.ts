export type TodoPriority = 'HIGH' | 'MEDIUM' | 'LOW'
export type TodoStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'

export interface TodoTagInfo {
  rowId: number
  tagName: string
  color: string | null
}

export interface Todo {
  rowId: number
  title: string
  content: string | null
  priority: TodoPriority
  category: string | null
  status: TodoStatus
  dueDate: string | null
  completedAt: string | null
  sortOrder: number
  projectRowId: number | null
  projectName: string | null
  parentRowId: number | null
  tags: TodoTagInfo[]
  subtaskCount: number
  subtaskCompletedCount: number
  createAt: string
  modifyAt: string
}

export interface TodoFormValues {
  title: string
  content?: string
  priority: TodoPriority
  category?: string
  dueDate?: string
  projectRowId?: number
  parentRowId?: number
  tagIds?: number[]
}

export interface TodoStats {
  totalCount: number
  pendingCount: number
  inProgressCount: number
  completedCount: number
  todayDueCount: number
  overDueCount: number
}
