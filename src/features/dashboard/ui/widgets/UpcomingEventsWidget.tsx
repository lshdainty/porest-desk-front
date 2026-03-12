import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarDays } from 'lucide-react'
import { useDashboardSummary } from '@/features/dashboard/model/useDashboardSummary'

const getDaysLabel = (days: number, t: (key: string, options?: Record<string, unknown>) => string) => {
  if (days === 0) return t('schedule.today')
  if (days === 1) return t('schedule.tomorrow')
  return t('schedule.daysLeft', { days })
}

export const UpcomingEventsWidget = () => {
  const { t } = useTranslation('dashboard')
  const navigate = useNavigate()
  const { data, isLoading } = useDashboardSummary()

  if (isLoading || !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const { upcomingEvents } = data

  return (
    <div className="flex h-full flex-col p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="text-accent-blue" />
          <h3 className="font-semibold">{t('schedule.title')}</h3>
        </div>
        <button
          onClick={() => navigate('/desk/calendar')}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          {t('viewAll')}
          <ArrowRight size={12} />
        </button>
      </div>

      <div className="mt-3 flex-1">
        {upcomingEvents.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t('calendar.noUpcoming')}</p>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div key={event.rowId} className="flex items-start gap-3">
                <div
                  className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: event.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.startDate).toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      weekday: 'short',
                    })}
                  </p>
                </div>
                <span className="flex-shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                  {getDaysLabel(event.daysUntil, t)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
