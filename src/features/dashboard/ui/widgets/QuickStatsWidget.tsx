import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CheckSquare, CalendarDays, FileText, Timer } from 'lucide-react'
import { useDashboardSummary } from '@/features/dashboard/model/useDashboardSummary'

export const QuickStatsWidget = () => {
  const { t } = useTranslation('dashboard')
  const navigate = useNavigate()
  const { data, isLoading } = useDashboardSummary()

  if (isLoading || !data) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">{t('loading', { ns: 'common' })}</p>
      </div>
    )
  }

  const stats = [
    {
      label: t('quick.dueToday'),
      value: data.todoSummary.todayDueCount,
      icon: <CheckSquare size={16} />,
      path: '/desk/todo',
    },
    {
      label: t('quick.todayEvents'),
      value: data.calendarSummary.todayEventCount,
      icon: <CalendarDays size={16} />,
      path: '/desk/calendar',
    },
    {
      label: t('quick.pinnedMemos'),
      value: data.memoSummary.pinnedCount,
      icon: <FileText size={16} />,
      path: '/desk/todo',
    },
    {
      label: t('quick.timerSessions'),
      value: data.timerSummary.todaySessionCount,
      icon: <Timer size={16} />,
      path: '/desk/timer',
    },
  ]

  return (
    <div className="flex h-full flex-col justify-center p-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <button
            key={stat.label}
            onClick={() => navigate(stat.path)}
            className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent"
          >
            <span className="text-muted-foreground">{stat.icon}</span>
            <div className="flex-1 text-left">
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
            <ArrowRight size={14} className="text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  )
}
