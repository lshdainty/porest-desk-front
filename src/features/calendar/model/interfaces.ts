import type { EventReminderInfo } from '@/entities/calendar'

export type TSourceType = 'calendar' | 'expense' | 'todo' | 'holiday'

export interface IEvent {
  id: number
  startDate: string
  endDate: string
  title: string
  description: string
  color: string
  isAllDay: boolean
  sourceType: TSourceType
  calendarRowId: number | null
  calendarName: string | null
  calendarColor: string | null
  labelRowId: number | null
  labelName: string | null
  labelColor: string | null
  location: string | null
  rrule: string | null
  recurrenceId: number | null
  reminders: EventReminderInfo[]
  groupRowId: number | null
  groupName: string | null
}

export interface ICalendarCell {
  day: number
  currentMonth: boolean
  date: Date
}
