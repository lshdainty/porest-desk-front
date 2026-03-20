import { useTranslation } from 'react-i18next'
import type { StatsPeriod } from '@/entities/expense'

interface PeriodSelectorProps {
  value: StatsPeriod
  onChange: (period: StatsPeriod) => void
}

const periods: StatsPeriod[] = ['3m', '6m', '1y']

export const PeriodSelector = ({ value, onChange }: PeriodSelectorProps) => {
  const { t } = useTranslation('expense')

  const labels: Record<StatsPeriod, string> = {
    '3m': t('stats.period3m'),
    '6m': t('stats.period6m'),
    '1y': t('stats.period1y'),
  }

  return (
    <div className="inline-flex items-center rounded-lg border bg-muted/30 p-1">
      {periods.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
            value === p
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {labels[p]}
        </button>
      ))}
    </div>
  )
}
