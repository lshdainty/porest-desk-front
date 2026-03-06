import { addMonths, format, getDaysInMonth, isSameDay, isToday, parseISO, startOfMonth, startOfYear } from 'date-fns'
import { enUS, ko } from 'date-fns/locale'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { useCalendar } from '@/features/calendar/model/calendar-context'
import { cn } from '@/shared/lib'

import type { IEvent } from '@/features/calendar/model/interfaces'

interface IProps {
  allEvents: IEvent[]
}

const WEEK_DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEK_DAYS_KO = ['일', '월', '화', '수', '목', '금', '토']

// ---- Year view day cell ---- //

const YearViewDayCell = ({
  day,
  date,
  events,
}: {
  day: number
  date: Date
  events: IEvent[]
}) => {
  const { setSelectedDate, setView } = useCalendar()

  const maxIndicators = 3
  const eventCount = events.length
  const isSunday = date.getDay() === 0
  const isSaturday = date.getDay() === 6

  const handleClick = () => {
    setSelectedDate(date)
    setView('day')
  }

  return (
    <button
      onClick={handleClick}
      type="button"
      className="flex h-11 flex-1 flex-col items-center justify-start gap-0.5 rounded-md pt-1 hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <div
        className={cn(
          'flex size-6 items-center justify-center rounded-full text-xs font-medium',
          isToday(date) && 'bg-primary font-semibold text-primary-foreground'
        )}
        style={{
          color: isToday(date) ? undefined : (isSunday ? '#ff6767' : isSaturday ? '#6767ff' : undefined),
        }}
      >
        {day}
      </div>

      {eventCount > 0 && (
        <div className="mt-0.5 flex gap-0.5">
          {eventCount <= maxIndicators ? (
            events.map(event => (
              <div
                key={event.id}
                className="size-1.5 rounded-full"
                style={{ backgroundColor: event.color }}
              />
            ))
          ) : (
            <>
              <div
                className="size-1.5 rounded-full"
                style={{ backgroundColor: events[0].color }}
              />
              <span className="text-[7px] text-muted-foreground">+{eventCount - 1}</span>
            </>
          )}
        </div>
      )}
    </button>
  )
}

// ---- Year view month card ---- //

const YearViewMonth = ({
  month,
  events,
}: {
  month: Date
  events: IEvent[]
}) => {
  const { i18n } = useTranslation()
  const { setSelectedDate, setView } = useCalendar()

  const locale = i18n.language.startsWith('ko') ? ko : enUS
  const weekDays = i18n.language.startsWith('ko') ? WEEK_DAYS_KO : WEEK_DAYS_EN
  const monthName = format(month, 'MMMM', { locale })

  const daysInMonth = useMemo(() => {
    const totalDays = getDaysInMonth(month)
    const firstDay = startOfMonth(month).getDay()

    const days = Array.from({ length: totalDays }, (_, i) => i + 1)
    const blanks = Array(firstDay).fill(null)

    return [...blanks, ...days]
  }, [month])

  const handleClick = () => {
    setSelectedDate(new Date(month.getFullYear(), month.getMonth(), 1))
    setView('month')
  }

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={handleClick}
        className="w-full rounded-t-lg border px-3 py-2 text-sm font-semibold hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {monthName}
      </button>

      <div className="flex-1 space-y-2 rounded-b-lg border border-t-0 p-3">
        <div className="grid grid-cols-7 gap-x-0.5 text-center">
          {weekDays.map((day, index) => {
            const isSunday = index === 0
            const isSaturday = index === 6

            return (
              <div
                key={index}
                className="text-xs font-medium"
                style={{ color: isSunday ? '#ff6767' : isSaturday ? '#6767ff' : undefined }}
              >
                {day}
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-7 gap-x-0.5 gap-y-2">
          {daysInMonth.map((day, index) => {
            if (day === null) return <div key={`blank-${index}`} className="h-10" />

            const date = new Date(month.getFullYear(), month.getMonth(), day)
            const dayEvents = events.filter(event =>
              isSameDay(parseISO(event.startDate), date) || isSameDay(parseISO(event.endDate), date)
            )

            return <YearViewDayCell key={`day-${day}`} day={day} date={date} events={dayEvents} />
          })}
        </div>
      </div>
    </div>
  )
}

// ---- Main year view ---- //

const CalendarYearView = ({ allEvents }: IProps) => {
  const { selectedDate } = useCalendar()

  const months = useMemo(() => {
    const yearStart = startOfYear(selectedDate)
    return Array.from({ length: 12 }, (_, i) => addMonths(yearStart, i))
  }, [selectedDate])

  return (
    <div className="w-full h-full overflow-y-auto scrollbar-hide p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {months.map(month => (
          <YearViewMonth key={month.toString()} month={month} events={allEvents} />
        ))}
      </div>
    </div>
  )
}

export { CalendarYearView }
