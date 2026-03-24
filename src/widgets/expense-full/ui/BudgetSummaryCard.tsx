import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp } from 'lucide-react'
import { cn } from '@/shared/lib'
import {
  useExpenseBudgets,
  useMonthlySummary,
} from '@/features/expense'

interface BudgetSummaryCardProps {
  year: number
  month: number
  onNavigateToBudget: () => void
}

export const BudgetSummaryCard = ({
  year,
  month,
  onNavigateToBudget,
}: BudgetSummaryCardProps) => {
  const { t } = useTranslation('expense')

  const { data: budgets } = useExpenseBudgets({ year, month })
  const { data: monthlySummary } = useMonthlySummary(year, month)

  const summary = useMemo(() => {
    if (!budgets?.length) return null

    const totalBudget = budgets.reduce((sum, b) => sum + b.budgetAmount, 0)
    const totalExpense = monthlySummary?.totalExpense ?? 0
    const percentage = totalBudget > 0 ? Math.round((totalExpense / totalBudget) * 100) : 0
    const remaining = totalBudget - totalExpense

    return { totalBudget, totalExpense, percentage, remaining }
  }, [budgets, monthlySummary])

  if (!summary) return null

  const barColor = summary.percentage > 100
    ? 'bg-red-500'
    : summary.percentage > 70
      ? 'bg-orange-500'
      : 'bg-blue-500'

  const textColor = summary.percentage > 100
    ? 'text-red-600 dark:text-red-400'
    : summary.percentage > 70
      ? 'text-orange-600 dark:text-orange-400'
      : 'text-blue-600 dark:text-blue-400'

  return (
    <button
      onClick={onNavigateToBudget}
      className="w-full rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted/50"
    >
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <TrendingUp size={14} />
          <span>{t('budget.title')}</span>
        </div>
        <span className={cn('font-bold', textColor)}>
          {summary.percentage}%
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all', barColor)}
          style={{ width: `${Math.min(summary.percentage, 100)}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {summary.totalExpense.toLocaleString()} / {summary.totalBudget.toLocaleString()}
        </span>
        <span className={summary.remaining < 0 ? 'text-red-500' : ''}>
          {summary.remaining >= 0
            ? `${t('budget.remaining')}: ${summary.remaining.toLocaleString()}`
            : `${t('budget.exceeded')}: ${Math.abs(summary.remaining).toLocaleString()}`
          }
        </span>
      </div>
    </button>
  )
}
