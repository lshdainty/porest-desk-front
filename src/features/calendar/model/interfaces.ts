import type { TCalendarType } from './types'
import type { EventReminderInfo } from '@/entities/calendar'

export interface IEvent {
  id: number
  startDate: string
  endDate: string
  title: string
  description: string
  color: string
  isAllDay: boolean
  type: TCalendarType
  labelRowId: number | null
  labelName: string | null
  labelColor: string | null
  location: string | null
  rrule: string | null
  recurrenceId: number | null
  reminders: EventReminderInfo[]
}

export interface ICalendarCell {
  day: number
  currentMonth: boolean
  date: Date
}
