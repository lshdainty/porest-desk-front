export type TCalendarView = 'day' | 'week' | 'month' | 'year' | 'agenda'

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
