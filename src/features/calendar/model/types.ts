export type TCalendarView = 'day' | 'week' | 'month' | 'year' | 'agenda'

// ================ Builtin Sources (가계부, 할일) ================ //

export type TCalendarSourceType = 'expense' | 'todo' | 'holiday'

export interface IBuiltinSource {
  id: TCalendarSourceType
  labelKey: string
  color: string
  enabled: boolean
}

export const BUILTIN_SOURCES: IBuiltinSource[] = [
  { id: 'holiday', labelKey: 'calendar.source.holiday', color: '#ef4444', enabled: true },
  { id: 'expense', labelKey: 'calendar.source.expense', color: '#22c55e', enabled: false },
  { id: 'todo', labelKey: 'calendar.source.todo', color: '#a855f7', enabled: false },
]

export type TEventColor =
  | 'blue'
  | 'green'
  | 'red'
  | 'yellow'
  | 'purple'
  | 'orange'
  | 'pink'
  | 'gray'
  | 'teal'

export type TBadgeVariant = 'dot' | 'bar'

export type TWorkingHours = {
  start: number
  end: number
}

export type TVisibleHours = {
  start: number
  end: number
}
