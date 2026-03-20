import { useMemo } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
} from 'date-fns'
import { getLocale } from '@/shared/lib/date'
import type { CalendarEvent } from '@/entities/calendar'
import { DayCell } from './DayCell'

interface MonthViewProps {
  currentDate: Date
  selectedDate: Date
  events: CalendarEvent[]
  onSelectDate: (date: Date) => void
}

export const MonthView = ({
  currentDate,
  selectedDate,
  events,
  onSelectDate,
}: MonthViewProps) => {
  const locale = getLocale()

  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

    const rows: Date[][] = []
    let day = calendarStart
    while (day <= calendarEnd) {
      const week: Date[] = []
      for (let i = 0; i < 7; i++) {
        week.push(day)
        day = addDays(day, 1)
      }
      rows.push(week)
    }
    return rows
  }, [currentDate])

  const dayHeaders = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 0 })
    return Array.from({ length: 7 }, (_, i) =>
      format(addDays(start, i), 'EEE', { locale })
    )
  }, [locale])

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventStart = new Date(event.startDate)
      const eventEnd = new Date(event.endDate)
      return date >= new Date(eventStart.toDateString()) &&
        date <= new Date(eventEnd.toDateString())
    })
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-px">
        {dayHeaders.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {weeks.map((week) =>
          week.map((date) => (
            <DayCell
              key={date.toISOString()}
              date={date}
              currentMonth={currentDate}
              selectedDate={selectedDate}
              events={getEventsForDate(date)}
              onClick={onSelectDate}
            />
          ))
        )}
      </div>
    </div>
  )
}
