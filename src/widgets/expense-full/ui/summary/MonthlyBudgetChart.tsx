import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PieChart, Pie, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/shared/ui/chart'
import type { ExpenseBudget, CategoryBreakdown, ExpenseCategory } from '@/entities/expense'
import { separateBreakdownByType } from '@/entities/expense'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('ko-KR').format(amount) + '원'

const getUsageColor = (percentage: number) => {
  if (percentage > 100) return '#dc2626'
  if (percentage >= 90) return '#ef4444'
  if (percentage >= 60) return '#f59e0b'
  return '#10b981'
}

const getUsageLabel = (percentage: number) => {
  if (percentage > 100) return '초과'
  if (percentage >= 90) return '위험'
  if (percentage >= 60) return '주의'
  return '안전'
}

interface MonthlyBudgetChartProps {
  budgets: ExpenseBudget[]
  categoryBreakdown: CategoryBreakdown[]
  categoryNames: Record<number, string>
  categories?: ExpenseCategory[]
}

export const MonthlyBudgetChart = ({ budgets, categoryBreakdown, categoryNames, categories }: MonthlyBudgetChartProps) => {
  const { t } = useTranslation('expense')

  const totalBudget = useMemo(() => {
    if (!budgets || budgets.length === 0) return 0
    const overallBudget = budgets.find((b) => b.categoryRowId === null)
    if (overallBudget) return overallBudget.budgetAmount
    return budgets.reduce((sum, b) => sum + b.budgetAmount, 0)
  }, [budgets])

  const totalExpense = useMemo(() => {
    if (!categoryBreakdown || !categories) return 0
    const { expenseBreakdown } = separateBreakdownByType(categoryBreakdown, categories)
    return expenseBreakdown.reduce((sum, c) => sum + c.totalAmount, 0)
  }, [categoryBreakdown, categories])

  const usagePercentage = useMemo(() => {
    if (totalBudget === 0) return 0
    return Math.round((totalExpense / totalBudget) * 1000) / 10
  }, [totalExpense, totalBudget])

  const gaugeData = useMemo(() => {
    const used = Math.min(usagePercentage, 100)
    const remaining = Math.max(100 - used, 0)
    return [
      { name: 'used', value: used, fill: getUsageColor(usagePercentage) },
      { name: 'remaining', value: remaining, fill: 'hsl(var(--muted))' },
    ]
  }, [usagePercentage])

  const gaugeConfig: ChartConfig = {
    used: { label: t('budget.title'), color: getUsageColor(usagePercentage) },
    remaining: { label: t('budget.remaining'), color: 'hsl(var(--muted))' },
  }

  const categoryBudgetData = useMemo(() => {
    if (!budgets || !categoryBreakdown || !categories) return []

    const categoryBudgets = budgets.filter((b) => b.categoryRowId !== null)
    if (categoryBudgets.length === 0) return []

    const { expenseBreakdown } = separateBreakdownByType(categoryBreakdown, categories)
    const expenseMap = new Map(expenseBreakdown.map((e) => [e.categoryRowId, e.totalAmount]))

    return categoryBudgets
      .map((b) => {
        const spent = expenseMap.get(b.categoryRowId!) ?? 0
        const percentage = b.budgetAmount > 0 ? Math.round((spent / b.budgetAmount) * 1000) / 10 : 0
        return {
          categoryName: categoryNames[b.categoryRowId!] ?? `카테고리 ${b.categoryRowId}`,
          budgetAmount: b.budgetAmount,
          spentAmount: spent,
          percentage,
        }
      })
      .sort((a, b) => b.percentage - a.percentage)
  }, [budgets, categoryBreakdown, categoryNames, categories])

  if (totalBudget === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">{t('stats.noBudgetSet')}</p>
      </div>
    )
  }

  const remaining = totalBudget - totalExpense

  return (
    <div>
      <div className="relative flex items-center justify-center">
        <ChartContainer config={gaugeConfig} className="aspect-[2/1] max-h-[200px] w-full">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(_value, name) => (
                    <span className="font-mono font-medium tabular-nums">
                      {name === 'used' ? `${usagePercentage.toFixed(1)}%` : `${Math.max(100 - usagePercentage, 0).toFixed(1)}%`}
                    </span>
                  )}
                />
              }
            />
            <Pie
              data={gaugeData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="85%"
              startAngle={180}
              endAngle={0}
              innerRadius="65%"
              outerRadius="95%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {gaugeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center">
          <p className="text-lg font-bold tabular-nums" style={{ color: getUsageColor(usagePercentage) }}>
            {usagePercentage}%
          </p>
          <p className="text-[11px] text-muted-foreground">
            {remaining >= 0
              ? `${t('budget.remaining')}: ${formatCurrency(remaining)}`
              : `${t('budget.exceeded')}: ${formatCurrency(Math.abs(remaining))}`}
          </p>
        </div>
      </div>

      <div className="mt-2 flex justify-center gap-6 text-xs text-muted-foreground">
        <span>{t('budget.amount')}: <strong className="text-foreground">{formatCurrency(totalBudget)}</strong></span>
        <span>{t('expense')}: <strong className="text-foreground">{formatCurrency(totalExpense)}</strong></span>
      </div>

      {categoryBudgetData.length > 0 && (
        <div className="mt-3">
          <div className="border-b pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t('categoryBreakdown')}
          </div>
          {categoryBudgetData.map((item) => (
            <div key={item.categoryName} className="border-b py-2.5 last:border-b-0">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium">{item.categoryName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {formatCurrency(item.spentAmount)} / {formatCurrency(item.budgetAmount)}
                  </span>
                  <span
                    className="rounded-md px-1.5 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: getUsageColor(item.percentage) }}
                  >
                    {getUsageLabel(item.percentage)}
                  </span>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(item.percentage, 100)}%`,
                    backgroundColor: getUsageColor(item.percentage),
                  }}
                />
              </div>
              <div className="mt-0.5 text-right text-xs tabular-nums text-muted-foreground">
                {item.percentage}%
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
