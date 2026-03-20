import { useState, useCallback, useMemo } from 'react'
import {
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  format,
} from 'date-fns'
import { useIsMobile } from '@/shared/hooks'

export type CalendarViewMode = 'month' | 'week'

export const useCalendarNavigation = () => {
  const isMobile = useIsMobile()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<CalendarViewMode>(isMobile ? 'week' : 'month')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const navigateForward = useCallback(() => {
    setCurrentDate((prev) =>
      viewMode === 'month' ? addMonths(prev, 1) : addWeeks(prev, 1)
    )
  }, [viewMode])

  const navigateBackward = useCallback(() => {
    setCurrentDate((prev) =>
      viewMode === 'month' ? subMonths(prev, 1) : subWeeks(prev, 1)
    )
  }, [viewMode])

  const goToToday = useCallback(() => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }, [])

  const dateRange = useMemo(() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
      return {
        start: calendarStart,
        end: calendarEnd,
        startDate: format(calendarStart, 'yyyy-MM-dd'),
        endDate: format(calendarEnd, 'yyyy-MM-dd'),
      }
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
      return {
        start: weekStart,
        end: weekEnd,
        startDate: format(weekStart, 'yyyy-MM-dd'),
        endDate: format(weekEnd, 'yyyy-MM-dd'),
      }
    }
  }, [currentDate, viewMode])

  return {
    currentDate,
    viewMode,
    selectedDate,
    dateRange,
    setViewMode,
    setSelectedDate,
    navigateForward,
    navigateBackward,
    goToToday,
  }
}
