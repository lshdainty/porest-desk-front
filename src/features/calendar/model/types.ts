export type TCalendarView = 'day' | 'week' | 'month' | 'year' | 'agenda'

// ================ Calendar Source (다중 캘린더) ================ //

export type TCalendarSourceType = 'schedule' | 'expense' | 'todo'

export interface ICalendarSource {
  id: TCalendarSourceType
  labelKey: string     // i18n 번역 키
  color: string        // 대표 색상 (hex)
  enabled: boolean     // ON/OFF 상태
}

export const DEFAULT_CALENDAR_SOURCES: ICalendarSource[] = [
  {
    id: 'schedule',
    labelKey: 'calendar.source.schedule',
    color: '#3b82f6',   // blue-500
    enabled: true,
  },
  {
    id: 'expense',
    labelKey: 'calendar.source.expense',
    color: '#22c55e',   // green-500
    enabled: false,
  },
  {
    id: 'todo',
    labelKey: 'calendar.source.todo',
    color: '#a855f7',   // purple-500
    enabled: false,
  },
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

export type TCalendarType = {
  id: string
  name: string
  nameKey: string
  isDate: boolean
  color: TEventColor
}

export type TBadgeVariant = 'dot' | 'bar'

export type TWorkingHours = {
  start: number
  end: number
}

export type TVisibleHours = {
  start: number
  end: number
}

export const calendarTypes: TCalendarType[] = [
  {
    id: 'PERSONAL',
    name: '개인',
    nameKey: 'calendar.type.personal',
    isDate: false,
    color: 'blue',
  },
  {
    id: 'WORK',
    name: '업무',
    nameKey: 'calendar.type.work',
    isDate: false,
    color: 'green',
  },
  {
    id: 'BIRTHDAY',
    name: '생일',
    nameKey: 'calendar.type.birthday',
    isDate: true,
    color: 'orange',
  },
  {
    id: 'HOLIDAY',
    name: '공휴일',
    nameKey: 'calendar.type.holiday',
    isDate: true,
    color: 'red',
  },
]
