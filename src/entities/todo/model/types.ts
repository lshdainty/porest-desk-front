export type TodoPriority = 'HIGH' | 'MEDIUM' | 'LOW'
export type TodoStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'

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
  createAt: string
  modifyAt: string
}

export interface TodoFormValues {
  title: string
  content?: string
  priority: TodoPriority
  category?: string
  dueDate?: string
}
