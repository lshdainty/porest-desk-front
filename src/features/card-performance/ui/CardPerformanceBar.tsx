import { useTranslation } from 'react-i18next'
import type { CardPerformance } from '@/entities/card'
import { cn } from '@/shared/lib'

interface Props {
  performance: CardPerformance
  className?: string
}

function formatKRW(n: number) {
  return new Intl.NumberFormat('ko-KR').format(n) + '원'
}

export function CardPerformanceBar({ performance, className }: Props) {
  const { t } = useTranslation('card')
  if (!performance.isRequired) {
    return (
      <div className={cn('text-sm text-muted-foreground', className)}>
        {t('noSpendingRequirement')}
      </div>
    )
  }

  const pct = Math.round(performance.achievementRate * 100)
  const barColor = performance.isAchieved ? 'bg-green-500' : pct >= 70 ? 'bg-amber-500' : 'bg-rose-500'

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">
          {formatKRW(performance.currentAmount)}
          <span className="text-muted-foreground"> / {formatKRW(performance.requiredAmount)}</span>
        </span>
        <span className={performance.isAchieved ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
          {pct}% {performance.isAchieved ? t('achieved') : ''}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full transition-all', barColor)}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      {!performance.isAchieved && performance.remainingAmount != null && (
        <div className="text-xs text-muted-foreground">
          {t('spendMoreForBenefit', { amount: formatKRW(performance.remainingAmount) })}
        </div>
      )}
    </div>
  )
}
