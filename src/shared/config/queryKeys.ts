export const authKeys = {
  all: ['auth'] as const,
  check: () => [...authKeys.all, 'check'] as const,
}

export const userKeys = {
  all: ['user'] as const,
  me: () => [...userKeys.all, 'me'] as const,
}

export const todoKeys = {
  all: ['todos'] as const,
  list: (filters?: Record<string, unknown>) => [...todoKeys.all, 'list', filters] as const,
  detail: (id: number) => [...todoKeys.all, 'detail', id] as const,
  subtasks: (parentId: number) => [...todoKeys.all, 'subtasks', parentId] as const,
  stats: () => [...todoKeys.all, 'stats'] as const,
}

export const todoProjectKeys = {
  all: ['todo-projects'] as const,
  list: () => [...todoProjectKeys.all, 'list'] as const,
}

export const todoTagKeys = {
  all: ['todo-tags'] as const,
  list: () => [...todoTagKeys.all, 'list'] as const,
}

export const calendarKeys = {
  all: ['calendar'] as const,
  events: (params?: Record<string, unknown>) => [...calendarKeys.all, 'events', params] as const,
  aggregate: (params?: Record<string, unknown>) => [...calendarKeys.all, 'aggregate', params] as const,
}

export const holidayKeys = {
  all: ['holidays'] as const,
  list: (params?: Record<string, unknown>) => [...holidayKeys.all, 'list', params] as const,
}

export const userCalendarKeys = {
  all: ['user-calendars'] as const,
  list: () => [...userCalendarKeys.all, 'list'] as const,
}

export const eventLabelKeys = {
  all: ['event-labels'] as const,
  list: () => [...eventLabelKeys.all, 'list'] as const,
}

export const memoKeys = {
  all: ['memos'] as const,
  list: (filters?: Record<string, unknown>) => [...memoKeys.all, 'list', filters] as const,
  detail: (id: number) => [...memoKeys.all, 'detail', id] as const,
  folders: () => [...memoKeys.all, 'folders'] as const,
}

export const calculatorKeys = {
  all: ['calculator'] as const,
  histories: () => [...calculatorKeys.all, 'histories'] as const,
}

export const timerKeys = {
  all: ['timer'] as const,
  sessions: (params?: Record<string, unknown>) => [...timerKeys.all, 'sessions', params] as const,
  dailyStats: (params?: Record<string, unknown>) => [...timerKeys.all, 'daily-stats', params] as const,
}

export const expenseKeys = {
  all: ['expenses'] as const,
  list: (filters?: Record<string, unknown>) => [...expenseKeys.all, 'list', filters] as const,
  categories: () => [...expenseKeys.all, 'categories'] as const,
  budgets: (params?: Record<string, unknown>) => [...expenseKeys.all, 'budgets', params] as const,
  dailySummary: (date: string) => [...expenseKeys.all, 'daily-summary', date] as const,
  monthlySummary: (year: number, month: number) => [...expenseKeys.all, 'monthly-summary', year, month] as const,
  weeklySummary: (weekStart: string, weekEnd: string) => [...expenseKeys.all, 'weekly-summary', weekStart, weekEnd] as const,
  yearlySummary: (year: number) => [...expenseKeys.all, 'yearly-summary', year] as const,
  merchantSummary: (params?: Record<string, unknown>) => [...expenseKeys.all, 'merchant-summary', params] as const,
  assetSummary: (params?: Record<string, unknown>) => [...expenseKeys.all, 'asset-summary', params] as const,
  search: (params?: Record<string, unknown>) => [...expenseKeys.all, 'search', params] as const,
  byCalendarEvent: (eventId: number) => [...expenseKeys.all, 'by-calendar-event', eventId] as const,
  byTodo: (todoId: number) => [...expenseKeys.all, 'by-todo', todoId] as const,
}

export const assetKeys = {
  all: ['assets'] as const,
  list: () => [...assetKeys.all, 'list'] as const,
  detail: (id: number) => [...assetKeys.all, 'detail', id] as const,
  summary: () => [...assetKeys.all, 'summary'] as const,
  transfers: (params?: Record<string, unknown>) => [...assetKeys.all, 'transfers', params] as const,
}

export const expenseTemplateKeys = {
  all: ['expense-templates'] as const,
  list: () => [...expenseTemplateKeys.all, 'list'] as const,
}

export const recurringTransactionKeys = {
  all: ['recurring-transactions'] as const,
  list: () => [...recurringTransactionKeys.all, 'list'] as const,
}

export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'list'] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
}

export const dutchPayKeys = {
  all: ['dutch-pay'] as const,
  list: () => [...dutchPayKeys.all, 'list'] as const,
  detail: (id: number) => [...dutchPayKeys.all, 'detail', id] as const,
}

export const groupKeys = {
  all: ['groups'] as const,
  list: () => [...groupKeys.all, 'list'] as const,
  detail: (id: number) => [...groupKeys.all, 'detail', id] as const,
}

export const eventCommentKeys = {
  all: ['event-comments'] as const,
  list: (eventId: number) => [...eventCommentKeys.all, 'list', eventId] as const,
}

export const fileKeys = {
  all: ['files'] as const,
  byReference: (referenceType: string, referenceRowId: number) => [...fileKeys.all, 'by-reference', referenceType, referenceRowId] as const,
}

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
}
