import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { PieChart, Pie, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/shared/ui/chart'
import { expenseApi } from '@/features/expense/api/expenseApi'
import { expenseBudgetApi } from '@/features/expense/api/expenseBudgetApi'
import { useExpenseCategories } from '@/features/expense'
import { separateBreakdownByType } from '@/entities/expense'
import { expenseKeys } from '@/shared/config'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원'
}

const getUsageColor = (percentage: number) => {
  if (percentage > 100) return '#dc2626'
  if (percentage >= 90) return '#ef4444'
  if (percentage >= 60) return '#f59e0b'
  return '#10b981'
}

const getUsageLabel = (percentage: number, t: (key: string) => string) => {
  if (percentage > 100) return t('budget.exceeded')
  if (percentage >= 90) return t('budget.danger')
  if (percentage >= 60) return t('budget.warning')
  return t('budget.safe')
}

export const MonthlyBudgetWidget = () => {
  const { t } = useTranslation('dashboard')
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const { data: summaryData, isLoading: loadingSummary } = useQuery({
    queryKey: expenseKeys.monthlySummary(year, month),
    queryFn: () => expenseApi.getMonthlySummary(year, month),
  })

  const { data: budgets, isLoading: loadingBudgets } = useQuery({
    queryKey: expenseKeys.budgets({ year, month }),
    queryFn: () => expenseBudgetApi.getBudgets({ year, month }),
  })

  const { data: categories } = useExpenseCategories()

  // 전체 예산 (categoryRowId가 null인 항목) 및 카테고리별 예산
  const totalBudget = useMemo(() => {
    if (!budgets) return 0
    const overallBudget = budgets.find((b) => b.categoryRowId === null)
    if (overallBudget) return overallBudget.budgetAmount
    return budgets.reduce((sum, b) => sum + b.budgetAmount, 0)
  }, [budgets])

  const totalExpense = useMemo(() => {
    if (!summaryData) return 0
    return summaryData.totalExpense
  }, [summaryData])

  const usagePercentage = useMemo(() => {
    if (totalBudget === 0) return 0
    return Math.round((totalExpense / totalBudget) * 1000) / 10
  }, [totalExpense, totalBudget])

  // 반원 게이지 데이터
  const gaugeData = useMemo(() => {
    const used = Math.min(usagePercentage, 100)
    const remaining = Math.max(100 - used, 0)
    return [
      { name: 'used', value: used, fill: getUsageColor(usagePercentage) },
      { name: 'remaining', value: remaining, fill: 'var(--muted)' },
    ]
  }, [usagePercentage])

  const gaugeConfig: ChartConfig = {
    used: { label: t('budget.used'), color: getUsageColor(usagePercentage) },
    remaining: { label: t('budget.remaining'), color: 'var(--muted)' },
  }

  // 카테고리별 예산 소진율
  const categoryBudgetData = useMemo(() => {
    if (!budgets || !summaryData?.categoryBreakdown || !categories) return []

    const categoryBudgets = budgets.filter((b) => b.categoryRowId !== null)
    if (categoryBudgets.length === 0) return []

    const { expenseBreakdown } = separateBreakdownByType(summaryData.categoryBreakdown, categories)
    const expenseMap = new Map(expenseBreakdown.map((e) => [e.categoryRowId, e.totalAmount]))

    return categoryBudgets
      .map((b) => {
        const spent = expenseMap.get(b.categoryRowId!) ?? 0
        const percentage = b.budgetAmount > 0 ? Math.round((spent / b.budgetAmount) * 1000) / 10 : 0
        const cat = categories.find((c) => c.rowId === b.categoryRowId)
        return {
          categoryName: cat?.categoryName ?? `카테고리 ${b.categoryRowId}`,
          budgetAmount: b.budgetAmount,
          spentAmount: spent,
          percentage,
        }
      })
      .sort((a, b) => b.percentage - a.percentage)
  }, [budgets, summaryData, categories])

  if (loadingSummary || loadingBudgets) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (totalBudget === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">{t('budget.noBudget')}</p>
      </div>
    )
  }

  const remaining = totalBudget - totalExpense

  return (
    <div className="flex h-full flex-col overflow-hidden p-4">
      {/* 반원 게이지 차트 */}
      <div className="relative flex shrink-0 items-center justify-center">
        <ChartContainer config={gaugeConfig} className="aspect-[2/1] h-full max-h-[200px] w-full">
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
              ? t('budget.remainingAmount', { amount: formatCurrency(remaining) })
              : t('budget.exceededAmount', { amount: formatCurrency(Math.abs(remaining)) })}
          </p>
        </div>
      </div>

      {/* 예산/지출 요약 */}
      <div className="mt-2 flex shrink-0 justify-center gap-6 text-xs text-muted-foreground">
        <span>
          {t('expense.budget')}:{' '}
          <strong className="text-foreground">{formatCurrency(totalBudget)}</strong>
        </span>
        <span>
          {t('chart.expense')}:{' '}
          <strong className="text-foreground">{formatCurrency(totalExpense)}</strong>
        </span>
      </div>

      {/* 카테고리별 예산 소진율 */}
      {categoryBudgetData.length > 0 && (
        <div className="mt-3 flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 border-b pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t('budget.categoryBudget')}
          </div>
          <div className="flex-1 overflow-y-auto">
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
                      {getUsageLabel(item.percentage, t)}
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
        </div>
      )}
    </div>
  )
}
