import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Timer } from 'lucide-react'
import { useDashboardSummary } from '@/features/dashboard/model/useDashboardSummary'

const formatFocusTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export const TimerSummaryWidget = () => {
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

  const { timerSummary } = data

  return (
    <div className="flex h-full flex-col p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer size={18} className="text-accent-purple" />
          <h3 className="font-semibold">{t('timer.title')}</h3>
        </div>
        <button
          onClick={() => navigate('/desk/timer')}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          {t('viewAll')}
          <ArrowRight size={12} />
        </button>
      </div>

      <div className="mt-3 flex-1 space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">{t('timer.todayFocus')}</p>
          <p className="text-3xl font-bold">{formatFocusTime(timerSummary.todayFocusSeconds)}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="rounded-md bg-muted px-2 py-1.5">
            <p className="font-semibold">{timerSummary.todaySessionCount}</p>
            <p className="text-muted-foreground">{t('timer.sessions')}</p>
          </div>
          <div className="rounded-md bg-muted px-2 py-1.5">
            <p className="font-semibold">{formatFocusTime(timerSummary.weeklyFocusSeconds)}</p>
            <p className="text-muted-foreground">{t('timer.weeklyFocus')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
