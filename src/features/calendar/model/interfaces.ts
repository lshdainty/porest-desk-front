import type { TCalendarType } from './types'

export interface IEvent {
  id: number
  startDate: string
  endDate: string
  title: string
  description: string
  color: string
  isAllDay: boolean
  type: TCalendarType
}

export interface ICalendarCell {
  day: number
  currentMonth: boolean
  date: Date
}
