import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Timer, ArrowRight, Play } from 'lucide-react'
import { formatDuration } from '@/shared/lib'
import { useDashboardSummary } from '@/features/dashboard'

export const TimerMiniWidget = () => {
  const { t } = useTranslation('dashboard')
  const navigate = useNavigate()
  const { data, isLoading } = useDashboardSummary()

  const summary = data?.timerSummary

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b p-3">
        <Timer size={16} className="text-primary" />
        <h3 className="text-sm font-semibold">{t('timer.title')}</h3>
      </div>

      <div className="flex-1 p-3">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : summary ? (
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-2xl font-bold font-mono">
                {formatDuration(summary.todayFocusSeconds)}
              </p>
              <p className="text-[10px] text-muted-foreground">{t('timer.todayFocus')}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md bg-muted/50 p-2 text-center">
                <p className="text-sm font-bold">{summary.todaySessionCount}</p>
                <p className="text-[10px] text-muted-foreground">{t('timer.sessions')}</p>
              </div>
              <div className="rounded-md bg-muted/50 p-2 text-center">
                <p className="text-sm font-bold">{formatDuration(summary.weeklyFocusSeconds)}</p>
                <p className="text-[10px] text-muted-foreground">{t('timer.weeklyFocus')}</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/desk/timer')}
              className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Play size={12} />
              {t('timer.startTimer')}
            </button>
          </div>
        ) : null}
      </div>

      <button
        onClick={() => navigate('/desk/timer')}
        className="flex items-center justify-center gap-1 border-t p-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        {t('viewAll')}
        <ArrowRight size={12} />
      </button>
    </div>
  )
}
