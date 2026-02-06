import { useTranslation } from 'react-i18next'
import { Clock, Target } from 'lucide-react'
import { formatDuration } from '@/shared/lib'
import { useTimerDailyStats } from '@/features/timer'

const getTodayRange = () => {
  const today = new Date()
  const dateStr = today.toISOString().split('T')[0]
  return { startDate: dateStr, endDate: dateStr }
}

export const DailyFocusStats = () => {
  const { t } = useTranslation('timer')
  const params = getTodayRange()
  const { data: stats } = useTimerDailyStats(params)

  const todayStat = stats?.[0]
  const totalSeconds = todayStat?.totalSeconds ?? 0
  const sessionCount = todayStat?.sessionCount ?? 0

  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">{t('todayFocus')}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Clock size={16} />
          </div>
          <div>
            <p className="text-lg font-bold">{formatDuration(totalSeconds)}</p>
            <p className="text-xs text-muted-foreground">{t('totalTime')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Target size={16} />
          </div>
          <div>
            <p className="text-lg font-bold">{sessionCount}</p>
            <p className="text-xs text-muted-foreground">{t('totalSessions')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
