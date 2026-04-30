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
  list: <T = Record<string, unknown>>(filters?: T) => [...todoKeys.all, 'list', filters] as const,
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
  events: <T = Record<string, unknown>>(params?: T) => [...calendarKeys.all, 'events', params] as const,
  aggregate: <T = Record<string, unknown>>(params?: T) => [...calendarKeys.all, 'aggregate', params] as const,
}

export const holidayKeys = {
  all: ['holidays'] as const,
  list: <T = Record<string, unknown>>(params?: T) => [...holidayKeys.all, 'list', params] as const,
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
  list: <T = Record<string, unknown>>(filters?: T) => [...memoKeys.all, 'list', filters] as const,
  detail: (id: number) => [...memoKeys.all, 'detail', id] as const,
  folders: () => [...memoKeys.all, 'folders'] as const,
}

export const calculatorKeys = {
  all: ['calculator'] as const,
  histories: () => [...calculatorKeys.all, 'histories'] as const,
}

export const expenseKeys = {
  all: ['expenses'] as const,
  list: <T = Record<string, unknown>>(filters?: T) => [...expenseKeys.all, 'list', filters] as const,
  categories: () => [...expenseKeys.all, 'categories'] as const,
  budgets: <T = Record<string, unknown>>(params?: T) => [...expenseKeys.all, 'budgets', params] as const,
  budgetCompliance: (months: number) => [...expenseKeys.all, 'budget-compliance', months] as const,
  recurring: () => [...expenseKeys.all, 'recurring'] as const,
  dailySummary: (date: string) => [...expenseKeys.all, 'daily-summary', date] as const,
  monthlySummary: (year: number, month: number) => [...expenseKeys.all, 'monthly-summary', year, month] as const,
  monthlyTrend: (months: number) => [...expenseKeys.all, 'monthly-trend', months] as const,
  weeklySummary: (weekStart: string, weekEnd: string) => [...expenseKeys.all, 'weekly-summary', weekStart, weekEnd] as const,
  yearlySummary: (year: number) => [...expenseKeys.all, 'yearly-summary', year] as const,
  merchantSummary: <T = Record<string, unknown>>(params?: T) => [...expenseKeys.all, 'merchant-summary', params] as const,
  heatmap: (year: number, month: number) => [...expenseKeys.all, 'heatmap', year, month] as const,
  assetSummary: <T = Record<string, unknown>>(params?: T) => [...expenseKeys.all, 'asset-summary', params] as const,
  search: <T = Record<string, unknown>>(params?: T) => [...expenseKeys.all, 'search', params] as const,
  byCalendarEvent: (eventId: number) => [...expenseKeys.all, 'by-calendar-event', eventId] as const,
  byTodo: (todoId: number) => [...expenseKeys.all, 'by-todo', todoId] as const,
}

export const assetKeys = {
  all: ['assets'] as const,
  list: () => [...assetKeys.all, 'list'] as const,
  detail: (id: number) => [...assetKeys.all, 'detail', id] as const,
  summary: (year?: number, month?: number) =>
    [...assetKeys.all, 'summary', year ?? null, month ?? null] as const,
  netWorthTrend: (months: number) => [...assetKeys.all, 'net-worth-trend', months] as const,
  balanceTrend: (assetId: number, weeks: number) => [...assetKeys.all, 'balance-trend', assetId, weeks] as const,
  transfers: <T = Record<string, unknown>>(params?: T) => [...assetKeys.all, 'transfers', params] as const,
}

export const savingGoalKeys = {
  all: ['saving-goals'] as const,
  list: () => [...savingGoalKeys.all, 'list'] as const,
  detail: (id: number) => [...savingGoalKeys.all, 'detail', id] as const,
}

export const cardKeys = {
  all: ['cards'] as const,
  catalogs: <T = Record<string, unknown>>(params?: T) => [...cardKeys.all, 'catalogs', params] as const,
  catalogDetail: (id: number) => [...cardKeys.all, 'catalog', id] as const,
  performance: (assetRowId: number, yearMonth: string) => [...cardKeys.all, 'performance', assetRowId, yearMonth] as const,
  benefitMappings: () => [...cardKeys.all, 'benefit-mappings'] as const,
  availableBenefits: (cardRowId: number, expenseCategoryRowId: number) =>
    [...cardKeys.all, 'available-benefits', cardRowId, expenseCategoryRowId] as const,
}

export const recurringTransactionKeys = {
  all: ['recurring-transactions'] as const,
  list: (params?: { upcoming?: boolean; limit?: number }) =>
    [...recurringTransactionKeys.all, 'list', params ?? {}] as const,
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
  siblingMembers: () => [...groupKeys.all, 'sibling-members'] as const,
}

export const expenseSplitKeys = {
  all: ['expense-splits'] as const,
  list: (expenseId: number) => [...expenseSplitKeys.all, 'list', expenseId] as const,
}

export const groupTypeKeys = {
  all: ['group-types'] as const,
  list: () => [...groupTypeKeys.all, 'list'] as const,
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
  layout: () => [...dashboardKeys.all, 'layout'] as const,
}
