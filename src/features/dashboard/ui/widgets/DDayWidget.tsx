import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays } from 'lucide-react'
import { dashboardApi } from '@/features/dashboard/api/dashboardApi'
import { dashboardKeys } from '@/shared/config'

export const DDayWidget = () => {
  const { t } = useTranslation('dashboard')

  const { data, isLoading } = useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: () => dashboardApi.getSummary(),
    refetchInterval: 60000,
  })

  const nearestEvent = useMemo(() => {
    if (!data?.upcomingEvents || data.upcomingEvents.length === 0) return null

    return [...data.upcomingEvents].sort((a, b) => a.daysUntil - b.daysUntil)[0]
  }, [data])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!nearestEvent) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">{t('noData')}</p>
      </div>
    )
  }

  const dDayText = nearestEvent.daysUntil === 0
    ? 'D-Day'
    : `D-${nearestEvent.daysUntil}`

  const eventDate = new Date(nearestEvent.startDate)
  const formattedDate = `${eventDate.getFullYear()}.${String(eventDate.getMonth() + 1).padStart(2, '0')}.${String(eventDate.getDate()).padStart(2, '0')}`

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: nearestEvent.color || '#3b82f6' }}
      >
        <CalendarDays size={20} className="text-white" />
      </div>
      <p className="text-center text-sm font-medium truncate max-w-full px-2">
        {nearestEvent.title}
      </p>
      <p className="text-xs text-muted-foreground">{formattedDate}</p>
      <p
        className={`text-2xl font-bold ${
          nearestEvent.daysUntil === 0 ? 'text-red-500' : 'text-primary'
        }`}
      >
        {dDayText}
      </p>
    </div>
  )
}
