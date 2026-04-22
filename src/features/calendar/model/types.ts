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
  { id: 'holiday', labelKey: 'calendar.source.holiday', color: '#C85561', enabled: true },
  { id: 'expense', labelKey: 'calendar.source.expense', color: '#5F6D3F', enabled: false },
  { id: 'todo', labelKey: 'calendar.source.todo', color: '#7D5AA3', enabled: false },
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
