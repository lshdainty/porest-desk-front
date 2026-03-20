import type { Todo } from '@/entities/todo'
import type { Expense } from '@/entities/expense'
export type CalendarEventType = 'PERSONAL' | 'WORK' | 'BIRTHDAY' | 'HOLIDAY'

export interface EventReminderInfo {
  rowId: number
  eventRowId: number
  reminderType: string
  minutesBefore: number
  isSent: boolean
}

export interface CalendarEvent {
  rowId: number
  title: string
  description: string | null
  eventType: CalendarEventType
  color: string
  startDate: string
  endDate: string
  isAllDay: boolean
  labelRowId: number | null
  labelName: string | null
  labelColor: string | null
  location: string | null
  rrule: string | null
  recurrenceId: number | null
  isException: boolean
  reminders: EventReminderInfo[]
  calendarRowId: number | null
  calendarName: string | null
  calendarColor: string | null
  groupRowId: number | null
  groupName: string | null
  createAt: string
  modifyAt: string
}

export interface CalendarEventFormValues {
  title: string
  description?: string
  eventType: CalendarEventType
  color: string
  startDate: string
  endDate: string
  isAllDay: boolean
  labelRowId?: number
  location?: string
  rrule?: string
  reminderMinutes?: number[]
  calendarRowId?: number
  groupRowId?: number
}

export interface CalendarAggregateData {
  events: CalendarEvent[]
  todos: Todo[]
  expenses: Expense[]
}

export type HolidayType = 'PUBLIC' | 'SUBSTITUTE' | 'CUSTOM'

export interface Holiday {
  rowId: number
  holidayDate: string  // 'yyyy-MM-dd'
  holidayName: string
  holidayType: HolidayType
  isRecurring: boolean
}
