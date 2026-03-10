import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { calendarApi } from '@/features/calendar/api/calendarApi'
import { holidayApi } from '@/features/calendar/api/holidayApi'
import { calendarKeys, holidayKeys } from '@/shared/config'

const DAY_KEYS = ['focus.sun', 'focus.mon', 'focus.tue', 'focus.wed', 'focus.thu', 'focus.fri', 'focus.sat']

export const MiniCalendarWidget = () => {
  const { t } = useTranslation('dashboard')
  const dayLabels = DAY_KEYS.map((key) => t(key))
  const today = new Date()
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const lastDay = new Date(year, month + 1, 0).getDate()
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const { data: events } = useQuery({
    queryKey: calendarKeys.events({ startDate, endDate }),
    queryFn: () => calendarApi.getEvents(startDate, endDate),
  })

  const { data: holidays } = useQuery({
    queryKey: holidayKeys.list({ startDate, endDate }),
    queryFn: () => holidayApi.getHolidays(startDate, endDate),
  })

  const holidayDates = useMemo(() => {
    if (!holidays) return new Set<string>()
    return new Set(holidays.map((h) => h.holidayDate))
  }, [holidays])

  const eventDates = useMemo(() => {
    if (!events) return new Set<string>()
    const dates = new Set<string>()
    events.forEach((e) => {
      const start = e.startDate.split('T')[0]
      dates.add(start)
    })
    return dates
  }, [events])

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1).getDay()
    const totalDays = new Date(year, month + 1, 0).getDate()
    const days: (number | null)[] = []

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null)
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push(d)
    }

    return days
  }, [year, month])

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    )
  }

  const isHoliday = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return holidayDates.has(dateStr)
  }

  const hasEvent = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return eventDates.has(dateStr)
  }

  const isSunday = (day: number) => {
    return new Date(year, month, day).getDay() === 0
  }

  const goToPrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1))
  }

  return (
    <div className="flex h-full flex-col p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={goToPrevMonth}
          className="rounded p-0.5 hover:bg-muted"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-sm font-semibold">
          {year}.{String(month + 1).padStart(2, '0')}
        </span>
        <button
          onClick={goToNextMonth}
          className="rounded p-0.5 hover:bg-muted"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px]">
        {dayLabels.map((label, i) => (
          <div
            key={label}
            className={`pb-1 font-medium ${i === 0 ? 'text-red-500' : 'text-muted-foreground'}`}
          >
            {label}
          </div>
        ))}

        {calendarDays.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="h-6" />
          }

          const sunday = isSunday(day)
          const holiday = isHoliday(day)
          const todayMatch = isToday(day)
          const event = hasEvent(day)

          return (
            <div
              key={day}
              className={`relative flex h-6 items-center justify-center text-[11px] ${
                todayMatch
                  ? 'rounded-full bg-primary text-primary-foreground font-bold'
                  : sunday || holiday
                    ? 'text-red-500'
                    : ''
              }`}
            >
              {day}
              {event && !todayMatch && (
                <span className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-blue-500" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
