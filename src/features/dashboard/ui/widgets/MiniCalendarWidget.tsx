import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { calendarApi } from '@/features/calendar/api/calendarApi'
import { holidayApi } from '@/features/calendar/api/holidayApi'
import { calendarKeys, holidayKeys } from '@/shared/config'
import { cn } from '@/shared/lib'

const WEEK_DAYS_KO = ['일', '월', '화', '수', '목', '금', '토']
const WEEK_DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface DayEvent {
  color: string
}

export const MiniCalendarWidget = () => {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const today = new Date()
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const weekDays = i18n.language.startsWith('ko') ? WEEK_DAYS_KO : WEEK_DAYS_EN

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

  // 날짜별 이벤트 색상 배열
  const eventsByDate = useMemo(() => {
    const map = new Map<string, DayEvent[]>()

    // 캘린더 이벤트
    if (events) {
      events.forEach((e) => {
        const dateKey = e.startDate.split('T')[0]
        const color = e.calendarColor || e.color || '#3b82f6'
        if (!map.has(dateKey)) map.set(dateKey, [])
        map.get(dateKey)!.push({ color })
      })
    }

    // 공휴일
    if (holidays) {
      holidays.forEach((h) => {
        const dateKey = h.holidayDate
        if (!map.has(dateKey)) map.set(dateKey, [])
        map.get(dateKey)!.push({ color: '#ef4444' })
      })
    }

    return map
  }, [events, holidays])

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

  const isTodayDate = (day: number) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    )
  }

  const handleDayClick = (day: number) => {
    const dateStr = format(new Date(year, month, day), 'yyyy-MM-dd')
    navigate(`/desk/calendar?date=${dateStr}&view=day`)
  }

  return (
    <div className="flex h-full flex-col p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="rounded p-0.5 hover:bg-muted"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-sm font-semibold">
          {year}.{String(month + 1).padStart(2, '0')}
        </span>
        <button
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="rounded p-0.5 hover:bg-muted"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* 요일 라벨 */}
      <div className="grid grid-cols-7 gap-x-0.5 text-center">
        {weekDays.map((label, i) => (
          <div
            key={i}
            className="pb-1 text-[10px] font-medium"
            style={{ color: i === 0 ? '#ff6767' : i === 6 ? '#6767ff' : undefined }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-x-0.5 gap-y-0.5">
        {calendarDays.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="h-10" />
          }

          const date = new Date(year, month, day)
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const todayMatch = isTodayDate(day)
          const isSunday = date.getDay() === 0
          const isSaturday = date.getDay() === 6
          const isHoliday = holidayDates.has(dateKey)
          const dayEvents = eventsByDate.get(dateKey) || []
          const maxIndicators = 3

          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDayClick(day)}
              className="flex h-10 flex-1 flex-col items-center justify-start gap-0.5 rounded-md pt-0.5 hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <div
                className={cn(
                  'flex size-5 items-center justify-center rounded-full text-[11px] font-medium',
                  todayMatch && 'bg-primary font-semibold text-primary-foreground'
                )}
                style={{
                  color: todayMatch
                    ? undefined
                    : isHoliday || isSunday
                      ? '#ff6767'
                      : isSaturday
                        ? '#6767ff'
                        : undefined,
                }}
              >
                {day}
              </div>

              {dayEvents.length > 0 && (
                <div className="flex gap-0.5">
                  {dayEvents.length <= maxIndicators ? (
                    dayEvents.map((event, i) => (
                      <div
                        key={i}
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: event.color }}
                      />
                    ))
                  ) : (
                    <>
                      <div
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: dayEvents[0].color }}
                      />
                      <span className="text-[7px] text-muted-foreground">
                        +{dayEvents.length - 1}
                      </span>
                    </>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
