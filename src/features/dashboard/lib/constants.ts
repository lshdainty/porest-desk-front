export interface Widget {
  id: string
  labelKey: string
  defaultH: number
  defaultW: number
  minW: number
  maxW: number
  minH: number
  maxH: number
}

export const WIDGETS: Widget[] = [
  // 기존 섹션 → 위젯 전환
  { id: 'greeting', labelKey: 'widget.greeting', defaultH: 3, defaultW: 12, minW: 6, maxW: 12, minH: 3, maxH: 4 },
  { id: 'todo-summary', labelKey: 'widget.todoSummary', defaultH: 5, defaultW: 4, minW: 3, maxW: 6, minH: 4, maxH: 7 },
  { id: 'expense-summary', labelKey: 'widget.expenseSummary', defaultH: 5, defaultW: 4, minW: 3, maxW: 6, minH: 4, maxH: 7 },
  { id: 'timer-summary', labelKey: 'widget.timerSummary', defaultH: 5, defaultW: 4, minW: 3, maxW: 6, minH: 4, maxH: 7 },
  { id: 'upcoming-events', labelKey: 'widget.upcomingEvents', defaultH: 8, defaultW: 6, minW: 4, maxW: 12, minH: 6, maxH: 14 },
  { id: 'expense-trend', labelKey: 'widget.expenseTrend', defaultH: 8, defaultW: 6, minW: 4, maxW: 12, minH: 6, maxH: 14 },
  { id: 'quick-stats', labelKey: 'widget.quickStats', defaultH: 3, defaultW: 12, minW: 6, maxW: 12, minH: 3, maxH: 4 },

  // 가계부 관련 신규
  { id: 'expense-category', labelKey: 'widget.expenseCategory', defaultH: 10, defaultW: 6, minW: 4, maxW: 8, minH: 8, maxH: 14 },
  { id: 'monthly-budget', labelKey: 'widget.monthlyBudget', defaultH: 6, defaultW: 6, minW: 4, maxW: 12, minH: 5, maxH: 10 },
  { id: 'asset-overview', labelKey: 'widget.assetOverview', defaultH: 6, defaultW: 6, minW: 4, maxW: 12, minH: 5, maxH: 10 },
  { id: 'monthly-compare', labelKey: 'widget.monthlyCompare', defaultH: 7, defaultW: 6, minW: 4, maxW: 12, minH: 5, maxH: 12 },

  // 일정 관련 신규
  { id: 'mini-calendar', labelKey: 'widget.miniCalendar', defaultH: 7, defaultW: 4, minW: 3, maxW: 6, minH: 7, maxH: 10 },
  { id: 'today-schedule', labelKey: 'widget.todaySchedule', defaultH: 8, defaultW: 4, minW: 3, maxW: 8, minH: 6, maxH: 14 },
  { id: 'dday', labelKey: 'widget.dday', defaultH: 5, defaultW: 4, minW: 3, maxW: 6, minH: 4, maxH: 8 },

  // 할일/메모 관련 신규
  { id: 'recent-todos', labelKey: 'widget.recentTodos', defaultH: 8, defaultW: 6, minW: 4, maxW: 12, minH: 6, maxH: 14 },
  { id: 'pinned-memos', labelKey: 'widget.pinnedMemos', defaultH: 7, defaultW: 6, minW: 4, maxW: 12, minH: 5, maxH: 12 },

  // 타이머 관련 신규
  { id: 'weekly-focus', labelKey: 'widget.weeklyFocus', defaultH: 7, defaultW: 6, minW: 4, maxW: 12, minH: 5, maxH: 10 },

  // 통계 차트 위젯
  { id: 'monthly-trend', labelKey: 'widget.monthlyTrend', defaultH: 8, defaultW: 6, minW: 4, maxW: 12, minH: 6, maxH: 14 },
  { id: 'year-over-year', labelKey: 'widget.yearOverYear', defaultH: 8, defaultW: 6, minW: 4, maxW: 12, minH: 6, maxH: 14 },
  { id: 'category-trend', labelKey: 'widget.categoryTrend', defaultH: 9, defaultW: 6, minW: 4, maxW: 12, minH: 7, maxH: 14 },
  { id: 'budget-vs-actual', labelKey: 'widget.budgetVsActual', defaultH: 8, defaultW: 6, minW: 4, maxW: 12, minH: 6, maxH: 14 },
  { id: 'merchant-analysis', labelKey: 'widget.merchantAnalysis', defaultH: 8, defaultW: 6, minW: 4, maxW: 12, minH: 6, maxH: 14 },
  { id: 'asset-usage', labelKey: 'widget.assetUsage', defaultH: 8, defaultW: 4, minW: 3, maxW: 8, minH: 6, maxH: 12 },

  // 유틸리티
  { id: 'timer-mini', labelKey: 'widget.timerMini', defaultH: 6, defaultW: 3, minW: 3, maxW: 6, minH: 5, maxH: 10 },
  { id: 'calculator-mini', labelKey: 'widget.calculatorMini', defaultH: 8, defaultW: 3, minW: 3, maxW: 6, minH: 6, maxH: 12 },
]

export const defaultLayouts = {
  lg: [
    { i: 'greeting', x: 0, y: 0, w: 12, h: 3 },
    { i: 'todo-summary', x: 0, y: 3, w: 4, h: 5 },
    { i: 'expense-summary', x: 4, y: 3, w: 4, h: 5 },
    { i: 'timer-summary', x: 8, y: 3, w: 4, h: 5 },
    { i: 'quick-stats', x: 0, y: 8, w: 12, h: 3 },
    { i: 'upcoming-events', x: 0, y: 11, w: 6, h: 8 },
    { i: 'expense-trend', x: 6, y: 11, w: 6, h: 8 },
    { i: 'recent-todos', x: 0, y: 19, w: 6, h: 8 },
    { i: 'weekly-focus', x: 6, y: 19, w: 6, h: 7 },
    { i: 'timer-mini', x: 0, y: 27, w: 3, h: 6 },
    { i: 'calculator-mini', x: 3, y: 27, w: 3, h: 8 },
  ],
  md: [
    { i: 'greeting', x: 0, y: 0, w: 10, h: 3 },
    { i: 'todo-summary', x: 0, y: 3, w: 5, h: 5 },
    { i: 'expense-summary', x: 5, y: 3, w: 5, h: 5 },
    { i: 'timer-summary', x: 0, y: 8, w: 5, h: 5 },
    { i: 'quick-stats', x: 0, y: 13, w: 10, h: 3 },
    { i: 'upcoming-events', x: 0, y: 16, w: 5, h: 8 },
    { i: 'expense-trend', x: 5, y: 16, w: 5, h: 8 },
    { i: 'recent-todos', x: 0, y: 24, w: 5, h: 8 },
    { i: 'weekly-focus', x: 5, y: 24, w: 5, h: 7 },
    { i: 'timer-mini', x: 0, y: 32, w: 5, h: 6 },
    { i: 'calculator-mini', x: 5, y: 32, w: 5, h: 8 },
  ],
  sm: [
    { i: 'greeting', x: 0, y: 0, w: 6, h: 3 },
    { i: 'todo-summary', x: 0, y: 3, w: 6, h: 5 },
    { i: 'expense-summary', x: 0, y: 8, w: 6, h: 5 },
    { i: 'timer-summary', x: 0, y: 13, w: 6, h: 5 },
    { i: 'quick-stats', x: 0, y: 18, w: 6, h: 3 },
    { i: 'upcoming-events', x: 0, y: 21, w: 6, h: 8 },
    { i: 'expense-trend', x: 0, y: 29, w: 6, h: 8 },
    { i: 'recent-todos', x: 0, y: 37, w: 6, h: 8 },
    { i: 'weekly-focus', x: 0, y: 45, w: 6, h: 7 },
  ],
}
