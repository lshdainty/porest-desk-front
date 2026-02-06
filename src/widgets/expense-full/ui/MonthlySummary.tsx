import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn, formatCurrency } from '@/shared/lib'
import { useMonthlySummary } from '@/features/expense'
import { ExpenseChart } from './ExpenseChart'

interface MonthlySummaryProps {
  year: number
  month: number
}

export const MonthlySummaryCard = ({ year, month }: MonthlySummaryProps) => {
  const { t } = useTranslation('expense')
  const { data: summary } = useMonthlySummary(year, month)

  const totalIncome = summary?.totalIncome ?? 0
  const totalExpense = summary?.totalExpense ?? 0
  const net = totalIncome - totalExpense
  const breakdown = summary?.categoryBreakdown ?? []

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <TrendingUp size={16} className="mx-auto mb-1 text-green-600" />
          <p className="text-xs text-muted-foreground">{t('totalIncome')}</p>
          <p className="text-sm font-bold text-green-600">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <TrendingDown size={16} className="mx-auto mb-1 text-red-600" />
          <p className="text-xs text-muted-foreground">{t('totalExpense')}</p>
          <p className="text-sm font-bold text-red-600">{formatCurrency(totalExpense)}</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground">{t('net')}</p>
          <p className={cn('mt-2 text-sm font-bold', net >= 0 ? 'text-green-600' : 'text-red-600')}>
            {net >= 0 ? '+' : ''}{formatCurrency(net)}
          </p>
        </div>
      </div>

      {/* Category breakdown chart */}
      {breakdown.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 text-sm font-medium">{t('categoryBreakdown')}</h3>
          <ExpenseChart breakdown={breakdown} />
        </div>
      )}

      {/* Category breakdown list */}
      {breakdown.length > 0 && (
        <div className="space-y-2">
          {breakdown.map((item) => (
            <div
              key={item.categoryRowId}
              className="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <span className="text-sm">{item.categoryName}</span>
              <span className="text-sm font-medium">{formatCurrency(item.totalAmount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
