import { isSameDay, parseISO } from 'date-fns'
import { useMemo } from 'react'

import { useCalendar } from '@/features/calendar/model/calendar-context'

import { DndProviderWrapper } from '@/features/calendar/ui/dnd/dnd-provider'

import { CalendarAgendaView } from '@/features/calendar/ui/agenda-view/calendar-agenda-view'
import { CalendarAgendaViewSkeleton } from '@/features/calendar/ui/agenda-view/calendar-agenda-view-skeleton'
import { CalendarHeader } from '@/features/calendar/ui/header/calendar-header'
import { CalendarMonthView } from '@/features/calendar/ui/month-view/calendar-month-view'
import { CalendarMonthViewSkeleton } from '@/features/calendar/ui/month-view/calendar-month-view-skeleton'
import { CalendarDayView } from '@/features/calendar/ui/week-and-day-view/calendar-day-view'
import { CalendarDayViewSkeleton } from '@/features/calendar/ui/week-and-day-view/calendar-day-view-skeleton'
import { CalendarWeekView } from '@/features/calendar/ui/week-and-day-view/calendar-week-view'
import { CalendarWeekViewSkeleton } from '@/features/calendar/ui/week-and-day-view/calendar-week-view-skeleton'
import { CalendarYearView } from '@/features/calendar/ui/year-view/calendar-year-view'
import { CalendarYearViewSkeleton } from '@/features/calendar/ui/year-view/calendar-year-view-skeleton'

import type { IEvent } from '@/features/calendar/model/interfaces'

interface IProps {
  events: IEvent[]
  isLoading?: boolean
}

const CalendarContainer = ({ events, isLoading = false }: IProps) => {
  const { selectedDate, view, isBuiltinSourceEnabled, isCalendarVisible } = useCalendar()

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const eventStartDate = parseISO(event.startDate)
      const eventEndDate = parseISO(event.endDate)

      // Source filtering
      if (event.sourceType === 'expense' && !isBuiltinSourceEnabled('expense')) return false
      if (event.sourceType === 'todo' && !isBuiltinSourceEnabled('todo')) return false
      if (event.sourceType === 'calendar' && event.calendarRowId && !isCalendarVisible(event.calendarRowId)) return false

      if (view === 'year') {
        const yearStart = new Date(selectedDate.getFullYear(), 0, 1)
        const yearEnd = new Date(selectedDate.getFullYear(), 11, 31, 23, 59, 59, 999)
        const isInSelectedYear = eventStartDate <= yearEnd && eventEndDate >= yearStart
        return isInSelectedYear
      }

      if (view === 'month' || view === 'agenda') {
        const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
        const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999)
        const isInSelectedMonth = eventStartDate <= monthEnd && eventEndDate >= monthStart
        return isInSelectedMonth
      }

      if (view === 'week') {
        const dayOfWeek = selectedDate.getDay()

        const weekStart = new Date(selectedDate)
        weekStart.setDate(selectedDate.getDate() - dayOfWeek)
        weekStart.setHours(0, 0, 0, 0)

        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        weekEnd.setHours(23, 59, 59, 999)

        const isInSelectedWeek = eventStartDate <= weekEnd && eventEndDate >= weekStart
        return isInSelectedWeek
      }

      if (view === 'day') {
        const dayStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0)
        const dayEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59)
        const isInSelectedDay = eventStartDate <= dayEnd && eventEndDate >= dayStart
        return isInSelectedDay
      }

      return true
    })
  }, [selectedDate, events, view, isBuiltinSourceEnabled, isCalendarVisible])

  const singleDayEvents = filteredEvents.filter(event => {
    if (event.isAllDay) return false
    const startDate = parseISO(event.startDate)
    const endDate = parseISO(event.endDate)
    return isSameDay(startDate, endDate)
  })

  const multiDayEvents = filteredEvents.filter(event => {
    if (event.isAllDay) return true
    const startDate = parseISO(event.startDate)
    const endDate = parseISO(event.endDate)
    return !isSameDay(startDate, endDate)
  })

  const eventStartDates = useMemo(() => {
    return filteredEvents.map(event => ({ ...event, endDate: event.startDate }))
  }, [filteredEvents])

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <CalendarHeader events={filteredEvents} />

      <div className="flex-1 overflow-hidden">
        <DndProviderWrapper>
          {view === 'day' && (
            isLoading
              ? <CalendarDayViewSkeleton />
              : <CalendarDayView singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} />
          )}
          {view === 'month' && (
            isLoading
              ? <CalendarMonthViewSkeleton />
              : <CalendarMonthView singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} />
          )}
          {view === 'week' && (
            isLoading
              ? <CalendarWeekViewSkeleton />
              : <CalendarWeekView singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} />
          )}
          {view === 'year' && (
            isLoading
              ? <CalendarYearViewSkeleton />
              : <CalendarYearView allEvents={eventStartDates} />
          )}
          {view === 'agenda' && (
            isLoading
              ? <CalendarAgendaViewSkeleton />
              : <CalendarAgendaView singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} />
          )}
        </DndProviderWrapper>
      </div>
    </div>
  )
}

export { CalendarContainer }
