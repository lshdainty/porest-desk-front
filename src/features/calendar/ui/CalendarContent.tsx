import { useMemo } from 'react'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from 'date-fns'

import { useCalendar } from '@/features/calendar/model/calendar-context'
import { useCalendarEvents } from '@/features/calendar/model/useCalendarEvents'
import { convertCalendarEventToIEvent } from '@/features/calendar/lib/helpers'
import { CalendarContainer } from '@/features/calendar/ui/CalendarContainer'

const CalendarContent = () => {
  const { selectedDate, view } = useCalendar()

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

  const { data: apiEvents, isLoading } = useCalendarEvents(startDate, endDate)

  const events = useMemo(() => {
    if (!apiEvents) return []
    return apiEvents.map(convertCalendarEventToIEvent)
  }, [apiEvents])

  return <CalendarContainer events={events} isLoading={isLoading} />
}

export { CalendarContent }
