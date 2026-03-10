import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { expenseApi } from '@/features/expense/api/expenseApi'
import { expenseKeys } from '@/shared/config'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원'
}

export const MonthlyBudgetWidget = () => {
  const { t } = useTranslation('dashboard')
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const { data, isLoading } = useQuery({
    queryKey: expenseKeys.monthlySummary(year, month),
    queryFn: () => expenseApi.getMonthlySummary(year, month),
  })

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">{t('noData')}</p>
      </div>
    )
  }

  const { totalIncome, totalExpense } = data
  const net = totalIncome - totalExpense
  const maxValue = Math.max(totalIncome, totalExpense, Math.abs(net), 1)

  const rows = [
    {
      label: t('chart.income'),
      value: totalIncome,
      color: 'bg-green-500',
      percentage: (totalIncome / maxValue) * 100,
    },
    {
      label: t('chart.expense'),
      value: totalExpense,
      color: 'bg-red-500',
      percentage: (totalExpense / maxValue) * 100,
    },
    {
      label: t('expense.net'),
      value: net,
      color: net >= 0 ? 'bg-blue-500' : 'bg-orange-500',
      percentage: (Math.abs(net) / maxValue) * 100,
    },
  ]

  return (
    <div className="flex h-full flex-col justify-center gap-4 p-4">
      {rows.map((row) => (
        <div key={row.label} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-semibold tabular-nums">
              {row.value < 0 ? '-' : ''}
              {formatCurrency(Math.abs(row.value))}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${row.color}`}
              style={{ width: `${Math.min(row.percentage, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
