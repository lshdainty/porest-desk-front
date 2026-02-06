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
}

export const calendarKeys = {
  all: ['calendar'] as const,
  events: (params?: Record<string, unknown>) => [...calendarKeys.all, 'events', params] as const,
  aggregate: (params?: Record<string, unknown>) => [...calendarKeys.all, 'aggregate', params] as const,
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
}

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
}
