import { useMemo } from 'react'
import { startOfWeek, addDays, format } from 'date-fns'
import { getLocale } from '@/shared/lib/date'
import type { CalendarEvent } from '@/entities/calendar'
import { DayCell } from './DayCell'

interface WeekViewProps {
  currentDate: Date
  selectedDate: Date
  events: CalendarEvent[]
  onSelectDate: (date: Date) => void
}

export const WeekView = ({
  currentDate,
  selectedDate,
  events,
  onSelectDate,
}: WeekViewProps) => {
  const locale = getLocale()

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 })
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [currentDate])

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
      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none">
        {weekDays.map((date) => (
          <div key={date.toISOString()} className="flex-1 min-w-0">
            <div className="mb-1 text-center text-[10px] font-medium text-muted-foreground">
              {format(date, 'EEE', { locale })}
            </div>
            <DayCell
              date={date}
              currentMonth={currentDate}
              selectedDate={selectedDate}
              events={getEventsForDate(date)}
              onClick={onSelectDate}
              compact
            />
          </div>
        ))}
      </div>
    </div>
  )
}
