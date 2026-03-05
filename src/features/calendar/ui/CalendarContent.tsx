import { useMemo } from 'react'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from 'date-fns'

import { useCalendar } from '@/features/calendar/model/calendar-context'
import { useCalendarEvents } from '@/features/calendar/model/useCalendarEvents'
import { useCalendarExpenses } from '@/features/calendar/model/useCalendarExpenses'
import { convertCalendarEventToIEvent, convertExpenseToIEvent } from '@/features/calendar/lib/helpers'
import { CalendarContainer } from '@/features/calendar/ui/CalendarContainer'

const CalendarContent = () => {
  const { selectedDate, view, isCalendarSourceEnabled } = useCalendar()

  const isExpenseEnabled = isCalendarSourceEnabled('expense')

  const eventRange = useMemo(() => {
    let start: Date
    let end: Date

    switch (view) {
      case 'month':
      case 'agenda':
        start = startOfMonth(selectedDate)
        end = endOfMonth(selectedDate)
        break
      case 'week':
      case 'day':
        start = startOfWeek(selectedDate)
        end = endOfWeek(selectedDate)
        break
      case 'year':
        start = startOfYear(selectedDate)
        end = endOfYear(selectedDate)
        break
      default:
        start = startOfMonth(selectedDate)
        end = endOfMonth(selectedDate)
    }

    return { start, end }
  }, [selectedDate, view])

  const startDate = format(eventRange.start, "yyyy-MM-dd'T'HH:mm:ss")
  const endDate = format(eventRange.end, "yyyy-MM-dd'T'HH:mm:ss")

  const { data: apiEvents, isLoading: isEventsLoading } = useCalendarEvents(startDate, endDate)

  // expense 캘린더가 ON일 때만 가계부 데이터 조회 (성능 최적화)
  const expenseDateRange = useMemo(() => ({
    startDate: format(eventRange.start, 'yyyy-MM-dd'),
    endDate: format(eventRange.end, 'yyyy-MM-dd'),
  }), [eventRange])

  const { data: expenseData, isLoading: isExpensesLoading } = useCalendarExpenses(
    expenseDateRange,
    isExpenseEnabled,
  )

  const events = useMemo(() => {
    const scheduleEvents = apiEvents ? apiEvents.map(convertCalendarEventToIEvent) : []
    const expenseEvents = (isExpenseEnabled && expenseData)
      ? expenseData.map(convertExpenseToIEvent)
      : []
    return [...scheduleEvents, ...expenseEvents]
  }, [apiEvents, expenseData, isExpenseEnabled])

  const isLoading = isEventsLoading || (isExpenseEnabled && isExpensesLoading)

  return <CalendarContainer events={events} isLoading={isLoading} />
}

export { CalendarContent }
