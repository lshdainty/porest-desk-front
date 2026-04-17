import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { useIsMobile } from '@/shared/hooks'
import { cn, formatCurrency } from '@/shared/lib'
import { separateBreakdownByType } from '@/entities/expense'
import { MonthlyBudgetChart } from './MonthlyBudgetChart'
import { BudgetVsActualChart } from './BudgetVsActualChart'
import type { ExpenseBudget, CategoryBreakdown, ExpenseCategory } from '@/entities/expense'

/** Color by usage percentage: <80% green, 80-100% orange, >100% red */
const getBudgetBarColor = (pct: number) => {
  if (pct > 100) return 'bg-red-500'
  if (pct >= 80) return 'bg-orange-500'
  return 'bg-emerald-500'
}

const getBudgetTextColor = (pct: number) => {
  if (pct > 100) return 'text-red-600 dark:text-red-400'
  if (pct >= 80) return 'text-orange-600 dark:text-orange-400'
  return 'text-emerald-600 dark:text-emerald-400'
}

interface SectionBudgetProps {
  budgets: ExpenseBudget[]
  categoryBreakdown: CategoryBreakdown[]
  categoryNames: Record<number, string>
  categories?: ExpenseCategory[]
}

export const SectionBudget = ({
  budgets,
  categoryBreakdown,
  categoryNames,
  categories,
}: SectionBudgetProps) => {
  const { t } = useTranslation('expense')
  const isMobile = useIsMobile()

  // Compute overall budget usage
  const overallUsage = useMemo(() => {
    if (!budgets?.length || !categories) return null
    const overallBudget = budgets.find((b) => b.categoryRowId === null)
    const totalBudget = overallBudget
      ? overallBudget.budgetAmount
      : budgets.reduce((sum, b) => sum + b.budgetAmount, 0)
    if (totalBudget === 0) return null
    const { expenseBreakdown } = separateBreakdownByType(categoryBreakdown, categories)
    const totalExpense = expenseBreakdown.reduce((sum, c) => sum + c.totalAmount, 0)
    const pct = Math.round((totalExpense / totalBudget) * 10) / 10
    return { totalBudget, totalExpense, percentage: pct }
  }, [budgets, categoryBreakdown, categories])

  // Category-level budget vs actual
  const categoryBudgetItems = useMemo(() => {
    if (!budgets || !categories) return []
    const catBudgets = budgets.filter((b) => b.categoryRowId !== null)
    if (catBudgets.length === 0) return []
    const { expenseBreakdown } = separateBreakdownByType(categoryBreakdown, categories)
    const expenseMap = new Map(expenseBreakdown.map((e) => [e.categoryRowId, e.totalAmount]))
    return catBudgets
      .map((b) => {
        const spent = expenseMap.get(b.categoryRowId!) ?? 0
        const pct = b.budgetAmount > 0 ? Math.round((spent / b.budgetAmount) * 10) / 10 : 0
        return {
          name: categoryNames[b.categoryRowId!] ?? `Category ${b.categoryRowId}`,
          budget: b.budgetAmount,
          spent,
          percentage: pct,
        }
      })
      .sort((a, b) => b.percentage - a.percentage)
  }, [budgets, categoryBreakdown, categoryNames, categories])

  // Circular progress SVG parameters
  const circleRadius = 42
  const circleCircumference = 2 * Math.PI * circleRadius
  const overallPct = overallUsage?.percentage ?? 0

  return (
    <div className="space-y-4">
      {/* Overall budget circular progress + category progress bars */}
      {overallUsage && (
        <div className="rounded-xl border p-5">
          <h3 className="mb-4 text-sm font-semibold">{t('stats.budgetOverview')}</h3>

          <div className={isMobile ? 'space-y-4' : 'grid grid-cols-[200px_1fr] gap-6'}>
            {/* Circular progress */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative h-36 w-36">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50" cy="50" r={circleRadius}
                    fill="none"
                    className="stroke-muted"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50" cy="50" r={circleRadius}
                    fill="none"
                    strokeWidth="8"
                    strokeLinecap="round"
                    className={cn(
                      'transition-all duration-700 ease-out',
                      overallPct > 100
                        ? 'stroke-red-500'
                        : overallPct >= 80
                          ? 'stroke-orange-500'
                          : 'stroke-emerald-500',
                    )}
                    strokeDasharray={`${Math.min(overallPct, 100) / 100 * circleCircumference} ${circleCircumference}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={cn(
                    'text-xl font-bold tabular-nums',
                    getBudgetTextColor(overallPct),
                  )}>
                    {overallPct}%
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {overallUsage.totalExpense > overallUsage.totalBudget
                      ? t('budget.exceeded')
                      : t('budget.remaining')}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-center text-xs text-muted-foreground">
                <span className="tabular-nums">{formatCurrency(overallUsage.totalExpense)}</span>
                {' / '}
                <span className="tabular-nums">{formatCurrency(overallUsage.totalBudget)}</span>
              </div>
            </div>

            {/* Category progress bars */}
            {categoryBudgetItems.length > 0 && (
              <div className="space-y-2.5">
                {categoryBudgetItems.map((item) => (
                  <div key={item.name}>
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium">{item.name}</span>
                        {item.percentage > 100 && (
                          <span className="text-red-500" title={t('budget.exceeded')}>
                            <AlertTriangle size={13} />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {formatCurrency(item.spent)} / {formatCurrency(item.budget)}
                        </span>
                        <span className={cn('text-xs font-bold tabular-nums', getBudgetTextColor(item.percentage))}>
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          getBudgetBarColor(item.percentage),
                        )}
                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Existing charts */}
      <div className={isMobile ? 'space-y-4' : 'grid grid-cols-2 gap-4'}>
        <div className="rounded-xl border p-5">
          <h3 className="mb-3 text-sm font-semibold">{t('stats.budgetGauge')}</h3>
          <MonthlyBudgetChart
            budgets={budgets}
            categoryBreakdown={categoryBreakdown}
            categoryNames={categoryNames}
            categories={categories}
          />
        </div>
        <div className="rounded-xl border p-5">
          <h3 className="mb-3 text-sm font-semibold">{t('stats.budgetVsActual')}</h3>
          <BudgetVsActualChart
            budgets={budgets}
            categoryBreakdown={categoryBreakdown}
            categoryNames={categoryNames}
          />
        </div>
      </div>
    </div>
  )
}
