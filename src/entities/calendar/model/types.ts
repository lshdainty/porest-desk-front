import type { Todo } from '@/entities/todo'
import type { Expense } from '@/entities/expense'
import type { TimerSession } from '@/entities/timer'

export type CalendarEventType = 'PERSONAL' | 'WORK' | 'BIRTHDAY' | 'HOLIDAY'

export interface CalendarEvent {
  rowId: number
  title: string
  description: string | null
  eventType: CalendarEventType
  color: string
  startDate: string
  endDate: string
  isAllDay: boolean
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
}

export interface CalendarAggregateData {
  events: CalendarEvent[]
  todos: Todo[]
  expenses: Expense[]
  timerSessions: TimerSession[]
}
