import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn, formatCurrency } from '@/shared/lib'
import { useDailySummary } from '@/features/expense'

interface DailySummaryProps {
  date: string
}

export const DailySummaryCard = ({ date }: DailySummaryProps) => {
  const { t } = useTranslation('expense')
  const { data: summary } = useDailySummary(date)

  const totalIncome = summary?.totalIncome ?? 0
  const totalExpense = summary?.totalExpense ?? 0
  const net = totalIncome - totalExpense

  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <h3 className="mb-3 text-xs font-medium text-muted-foreground">{t('daily')}</h3>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="mb-1 flex justify-center">
            <TrendingUp size={14} className="text-green-600 dark:text-green-400" />
          </div>
          <p className="text-xs text-muted-foreground">{t('totalIncome')}</p>
          <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="text-center">
          <div className="mb-1 flex justify-center">
            <TrendingDown size={14} className="text-red-600 dark:text-red-400" />
          </div>
          <p className="text-xs text-muted-foreground">{t('totalExpense')}</p>
          <p className="text-sm font-bold text-red-600 dark:text-red-400">{formatCurrency(totalExpense)}</p>
        </div>
        <div className="text-center">
          <div className="mb-1 flex justify-center">
            <Minus size={14} className={cn(net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')} />
          </div>
          <p className="text-xs text-muted-foreground">{t('net')}</p>
          <p className={cn('text-sm font-bold', net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
            {formatCurrency(Math.abs(net))}
          </p>
        </div>
      </div>
    </div>
  )
}
