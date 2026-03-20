import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, ArrowRight } from 'lucide-react'
import type { DashboardSummary } from '@/features/dashboard/api/dashboardApi'

interface Props {
  data: DashboardSummary
}

const getDaysLabel = (days: number, t: (key: string, options?: Record<string, unknown>) => string) => {
  if (days === 0) return t('schedule.today')
  if (days === 1) return t('schedule.tomorrow')
  return t('schedule.daysLeft', { days })
}

export const ScheduleSection = ({ data }: Props) => {
  const { t } = useTranslation('dashboard')
  const navigate = useNavigate()

  const { upcomingEvents } = data

  return (
    <div className="flex flex-col rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
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
      <div className="flex-1 p-4">
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
                <div className="flex-1 min-w-0">
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
