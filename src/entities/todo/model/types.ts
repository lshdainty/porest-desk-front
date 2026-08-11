export type TodoPriority = 'HIGH' | 'MEDIUM' | 'LOW'
export type TodoStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
export type TodoType = 'TASK' | 'NOTE'

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
  type: TodoType
  isPinned: boolean
  dueDate: string | null
  completedAt: string | null
  sortOrder: number
  parentRowId: number | null
  tags: TodoTagInfo[]
  subtaskCount: number
  subtaskCompletedCount: number
  createAt: string
  modifyAt: string
  /** 이번 상태 토글로 실제 적립된 별빛 — 토글 응답에만 실린다(그 외 0). 토스트 근거. */
  earnedStarlight?: number
}

export interface TodoFormValues {
  title: string
  content?: string
  priority: TodoPriority
  category?: string
  dueDate?: string
  parentRowId?: number
  tagIds?: number[]
  type?: TodoType
}

export interface TodoStats {
  totalCount: number
  pendingCount: number
  inProgressCount: number
  completedCount: number
  todayDueCount: number
  overDueCount: number
  noteCount: number
}
