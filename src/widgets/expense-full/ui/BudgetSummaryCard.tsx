import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, AlertTriangle, AlertCircle } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
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

  const isExceeded = summary.percentage > 100
  const isDanger = summary.percentage > 90 && !isExceeded
  const isWarning = summary.percentage > 70 && summary.percentage <= 90

  // 그라디언트 바 색상
  const barGradient = isExceeded
    ? 'bg-gradient-to-r from-red-400 to-red-600'
    : isDanger
      ? 'bg-gradient-to-r from-orange-400 to-red-500'
      : isWarning
        ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
        : 'bg-gradient-to-r from-emerald-400 to-blue-500'

  const textColor = isExceeded
    ? 'text-red-600 dark:text-red-400'
    : isDanger
      ? 'text-red-500 dark:text-red-400'
      : isWarning
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
          {/* 단계별 경고 배지 */}
          {isExceeded && (
            <Badge variant="destructive" className="ml-1 gap-0.5 px-1.5 py-0 text-[10px]">
              <AlertCircle size={9} />
              {t('budget.exceeded')}
            </Badge>
          )}
          {isDanger && (
            <Badge className="ml-1 gap-0.5 bg-red-100 px-1.5 py-0 text-[10px] text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400">
              <AlertCircle size={9} />
              {t('budget.danger')}
            </Badge>
          )}
          {isWarning && (
            <Badge className="ml-1 gap-0.5 bg-orange-100 px-1.5 py-0 text-[10px] text-orange-700 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400">
              <AlertTriangle size={9} />
              {t('budget.warning')}
            </Badge>
          )}
        </div>
        <span className={cn('font-bold', textColor)}>
          {summary.percentage}%
        </span>
      </div>
      <div className="mt-2 relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barGradient)}
          style={{ width: `${Math.min(summary.percentage, 100)}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {summary.totalExpense.toLocaleString()} / {summary.totalBudget.toLocaleString()}
        </span>
        <span className={summary.remaining < 0 ? 'text-red-500 font-medium' : ''}>
          {summary.remaining >= 0
            ? `${t('budget.remaining')}: ${summary.remaining.toLocaleString()}`
            : `${t('budget.exceeded')}: ${Math.abs(summary.remaining).toLocaleString()}`
          }
        </span>
      </div>
    </button>
  )
}
