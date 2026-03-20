export interface UserCalendar {
  rowId: number
  calendarName: string
  color: string
  sortOrder: number
  isDefault: boolean
  isVisible: boolean
}

export interface UserCalendarFormValues {
  calendarName: string
  color: string
}
