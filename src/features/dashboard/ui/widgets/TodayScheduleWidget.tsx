import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { calendarApi } from '@/features/calendar/api/calendarApi'
import { calendarKeys } from '@/shared/config'

export const TodayScheduleWidget = () => {
  const { t } = useTranslation('dashboard')

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const { data: events, isLoading } = useQuery({
    queryKey: calendarKeys.events({ startDate: todayStr, endDate: todayStr }),
    queryFn: () => calendarApi.getEvents(todayStr, todayStr),
  })

  const sortedEvents = useMemo(() => {
    if (!events) return []
    return [...events].sort((a, b) => a.startDate.localeCompare(b.startDate))
  }, [events])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!events || sortedEvents.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">{t('noData')}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-1 overflow-y-auto p-3">
      {sortedEvents.map((event) => {
        const startTime = event.isAllDay
          ? t('allDay')
          : new Date(event.startDate).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })

        return (
          <div
            key={event.rowId}
            className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
          >
            <span className="mt-0.5 text-xs font-medium text-muted-foreground tabular-nums w-10 shrink-0">
              {startTime}
            </span>
            <div
              className="mt-1 h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: event.color || '#3b82f6' }}
            />
            <span className="text-sm truncate">{event.title}</span>
          </div>
        )
      })}
    </div>
  )
}
