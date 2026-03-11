import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInDays,
  differenceInMinutes,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isSameDay,
  isSameMonth,
  isSameWeek,
  isSameYear,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears,
  type Locale,
} from 'date-fns'

import type { CalendarEvent, Holiday } from '@/entities/calendar'
import type { Expense } from '@/entities/expense'
import type { IEvent, ICalendarCell } from '@/features/calendar/model/interfaces'
import type { TCalendarView, TVisibleHours, TWorkingHours } from '@/features/calendar/model/types'

// ================ Header helper functions ================ //

export function rangeText(view: TCalendarView, date: Date, locale?: Locale) {
  const formatString = 'yyyy.MM.dd'
  let start: Date
  let end: Date

  switch (view) {
    case 'agenda':
      start = startOfMonth(date)
      end = endOfMonth(date)
      break
    case 'year':
      start = startOfYear(date)
      end = endOfYear(date)
      break
    case 'month':
      start = startOfMonth(date)
      end = endOfMonth(date)
      break
    case 'week':
      start = startOfWeek(date, { locale })
      end = endOfWeek(date, { locale })
      break
    case 'day':
      return format(date, formatString, { locale })
    default:
      return ''
  }

  return `${format(start, formatString, { locale })} - ${format(end, formatString, { locale })}`
}

export function navigateDate(date: Date, view: TCalendarView, direction: 'previous' | 'next'): Date {
  const operations = {
    agenda: direction === 'next' ? addMonths : subMonths,
    year: direction === 'next' ? addYears : subYears,
    month: direction === 'next' ? addMonths : subMonths,
    week: direction === 'next' ? addWeeks : subWeeks,
    day: direction === 'next' ? addDays : subDays,
  }

  return operations[view](date, 1)
}

export function getEventsCount(events: IEvent[], date: Date, view: TCalendarView): number {
  const compareFns = {
    agenda: isSameMonth,
    year: isSameYear,
    day: isSameDay,
    week: isSameWeek,
    month: isSameMonth,
  }

  return events.filter(event => compareFns[view](new Date(event.startDate), date)).length
}

// ================ Week and day view helper functions ================ //

export function getCurrentEvents(events: IEvent[]) {
  const now = new Date()
  return events.filter(event => isWithinInterval(now, { start: parseISO(event.startDate), end: parseISO(event.endDate) })) || null
}

export function groupEvents(dayEvents: IEvent[]) {
  const sortedEvents = dayEvents.sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime())
  const groups: IEvent[][] = []

  for (const event of sortedEvents) {
    const eventStart = parseISO(event.startDate)

    let placed = false
    for (const group of groups) {
      const lastEventInGroup = group[group.length - 1]
      const lastEventEnd = parseISO(lastEventInGroup.endDate)

      if (eventStart >= lastEventEnd) {
        group.push(event)
        placed = true
        break
      }
    }

    if (!placed) groups.push([event])
  }

  return groups
}

export function getEventBlockStyle(event: IEvent, day: Date, groupIndex: number, groupSize: number, visibleHoursRange?: { from: number, to: number }) {
  const startDate = parseISO(event.startDate)
  const dayStart = new Date(day.setHours(0, 0, 0, 0))
  const eventStart = startDate < dayStart ? dayStart : startDate
  const startMinutes = differenceInMinutes(eventStart, dayStart)

  let top

  if (visibleHoursRange) {
    const visibleStartMinutes = visibleHoursRange.from * 60
    const visibleEndMinutes = visibleHoursRange.to * 60
    const visibleRangeMinutes = visibleEndMinutes - visibleStartMinutes
    top = ((startMinutes - visibleStartMinutes) / visibleRangeMinutes) * 100
  } else {
    top = (startMinutes / 1440) * 100
  }

  const width = 100 / groupSize
  const left = groupIndex * width

  return { top: `${top}%`, width: `${width}%`, left: `${left}%` }
}

export function isWorkingHour(hour: number, workingHours: TWorkingHours) {
  return hour >= workingHours.start && hour < workingHours.end
}

export function getVisibleHours(visibleHours: TVisibleHours, singleDayEvents: IEvent[]) {
  let earliestEventHour = visibleHours.start
  let latestEventHour = visibleHours.end

  singleDayEvents.forEach(event => {
    const startHour = parseISO(event.startDate).getHours()
    const endTime = parseISO(event.endDate)
    const endHour = endTime.getHours() + (endTime.getMinutes() > 0 ? 1 : 0)
    if (startHour < earliestEventHour) earliestEventHour = startHour
    if (endHour > latestEventHour) latestEventHour = endHour
  })

  latestEventHour = Math.min(latestEventHour, 24)

  const hours = Array.from({ length: latestEventHour - earliestEventHour }, (_, i) => i + earliestEventHour)

  return { hours, earliestEventHour, latestEventHour }
}

// ================ Month view helper functions ================ //

/**
 * 이벤트의 고유 키 생성
 */
export function getEventUniqueKey(event: IEvent): string {
  return `${event.id}`
}

export function getCalendarCells(selectedDate: Date): ICalendarCell[] {
  const currentYear = selectedDate.getFullYear()
  const currentMonth = selectedDate.getMonth()

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth)
  const daysInPrevMonth = getDaysInMonth(currentYear, currentMonth - 1)
  const totalDays = firstDayOfMonth + daysInMonth

  const prevMonthCells = Array.from({ length: firstDayOfMonth }, (_, i) => ({
    day: daysInPrevMonth - firstDayOfMonth + i + 1,
    currentMonth: false,
    date: new Date(currentYear, currentMonth - 1, daysInPrevMonth - firstDayOfMonth + i + 1),
  }))

  const currentMonthCells = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    currentMonth: true,
    date: new Date(currentYear, currentMonth, i + 1),
  }))

  const nextMonthCells = Array.from({ length: (7 - (totalDays % 7)) % 7 }, (_, i) => ({
    day: i + 1,
    currentMonth: false,
    date: new Date(currentYear, currentMonth + 1, i + 1),
  }))

  return [...prevMonthCells, ...currentMonthCells, ...nextMonthCells]
}

export function calculateMonthEventPositions(multiDayEvents: IEvent[], singleDayEvents: IEvent[], selectedDate: Date) {
  const monthStart = startOfMonth(selectedDate)
  const monthEnd = endOfMonth(selectedDate)

  const eventPositions: { [key: string]: number } = {}
  const occupiedPositions: { [key: string]: boolean[] } = {}

  eachDayOfInterval({ start: monthStart, end: monthEnd }).forEach(day => {
    const dayKey = startOfDay(day).toISOString()
    occupiedPositions[dayKey] = [false, false, false]
  })

  const sortedEvents = [
    ...multiDayEvents.sort((a, b) => {
      const aDuration = differenceInDays(parseISO(a.endDate), parseISO(a.startDate))
      const bDuration = differenceInDays(parseISO(b.endDate), parseISO(b.startDate))
      return bDuration - aDuration || parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
    }),
    ...singleDayEvents.sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()),
  ]

  sortedEvents.forEach(event => {
    const eventStart = parseISO(event.startDate)
    const eventEnd = parseISO(event.endDate)
    const eventKey = getEventUniqueKey(event)

    const eventDays = eachDayOfInterval({
      start: eventStart < monthStart ? monthStart : startOfDay(eventStart),
      end: eventEnd > monthEnd ? monthEnd : startOfDay(eventEnd),
    })

    let position = -1

    for (let i = 0; i < 3; i++) {
      if (
        eventDays.every(day => {
          const dayKey = startOfDay(day).toISOString()
          const dayPositions = occupiedPositions[dayKey]
          return dayPositions && !dayPositions[i]
        })
      ) {
        position = i
        break
      }
    }

    if (position !== -1) {
      eventDays.forEach(day => {
        const dayKey = startOfDay(day).toISOString()
        occupiedPositions[dayKey][position] = true
      })
      eventPositions[eventKey] = position
    }
  })

  return eventPositions
}

export function getMonthCellEvents(date: Date, events: IEvent[], eventPositions: Record<string, number>) {
  const eventsForDate = events.filter(event => {
    const eventStart = parseISO(event.startDate)
    const eventEnd = parseISO(event.endDate)
    const cellDateStart = startOfDay(date)

    return isSameDay(cellDateStart, eventStart) ||
           isSameDay(cellDateStart, eventEnd) ||
           (cellDateStart >= startOfDay(eventStart) && cellDateStart <= startOfDay(eventEnd))
  })

  return eventsForDate
    .map(event => ({
      ...event,
      position: eventPositions[getEventUniqueKey(event)] ?? -1,
      isMultiDay: event.startDate !== event.endDate,
    }))
    .sort((a, b) => {
      if (a.isMultiDay && !b.isMultiDay) return -1
      if (!a.isMultiDay && b.isMultiDay) return 1
      return a.position - b.position
    })
}

// ================ Data conversion functions ================ //

/**
 * Expense (가계부 데이터)를 IEvent 인터페이스로 변환
 */
export function convertExpenseToIEvent(expense: Expense): IEvent {
  const isIncome = expense.expenseType === 'INCOME'
  const color = isIncome ? '#22c55e' : '#ef4444'
  const sign = isIncome ? '+' : '-'
  const formattedAmount = new Intl.NumberFormat('ko-KR').format(expense.amount)
  const categoryName = expense.categoryName || ''
  const title = categoryName
    ? `${categoryName} ${sign}${formattedAmount}원`
    : `${sign}${formattedAmount}원`

  return {
    id: expense.rowId,
    startDate: expense.expenseDate,
    endDate: expense.expenseDate,
    title,
    description: expense.description || '',
    color,
    isAllDay: true,
    sourceType: 'expense',
    calendarRowId: null,
    calendarName: null,
    calendarColor: null,
    labelRowId: null,
    labelName: null,
    labelColor: null,
    location: null,
    rrule: null,
    recurrenceId: null,
    reminders: [],
    groupRowId: null,
    groupName: null,
  }
}

/**
 * Holiday (공휴일 데이터)를 IEvent 인터페이스로 변환
 */
export function convertHolidayToIEvent(holiday: Holiday): IEvent {
  return {
    id: holiday.rowId + 1000000,
    startDate: `${holiday.holidayDate}T00:00:00`,
    endDate: `${holiday.holidayDate}T23:59:59`,
    title: holiday.holidayName,
    description: '',
    color: '#ef4444',
    isAllDay: true,
    sourceType: 'holiday',
    calendarRowId: null,
    calendarName: null,
    calendarColor: null,
    labelRowId: null,
    labelName: null,
    labelColor: null,
    location: null,
    rrule: null,
    recurrenceId: null,
    reminders: [],
    groupRowId: null,
    groupName: null,
  }
}

/**
 * CalendarEvent (API 응답)를 IEvent 인터페이스로 변환
 */
export function convertCalendarEventToIEvent(calendarEvent: CalendarEvent): IEvent {
  return {
    id: calendarEvent.rowId,
    startDate: calendarEvent.startDate,
    endDate: calendarEvent.endDate,
    title: calendarEvent.title,
    description: calendarEvent.description ?? '',
    color: calendarEvent.calendarColor || calendarEvent.color || '#3b82f6',
    isAllDay: calendarEvent.isAllDay,
    sourceType: 'calendar',
    calendarRowId: calendarEvent.calendarRowId ?? null,
    calendarName: calendarEvent.calendarName ?? null,
    calendarColor: calendarEvent.calendarColor ?? null,
    labelRowId: calendarEvent.labelRowId ?? null,
    labelName: calendarEvent.labelName ?? null,
    labelColor: calendarEvent.labelColor ?? null,
    location: calendarEvent.location ?? null,
    rrule: calendarEvent.rrule ?? null,
    recurrenceId: calendarEvent.recurrenceId ?? null,
    reminders: calendarEvent.reminders ?? [],
    groupRowId: calendarEvent.groupRowId ?? null,
    groupName: calendarEvent.groupName ?? null,
  }
}
