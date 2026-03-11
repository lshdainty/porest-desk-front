import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/shared/ui/chart'
import { formatCurrency } from '@/shared/lib'
import type { ExpenseBudget, CategoryBreakdown } from '@/entities/expense'

interface BudgetVsActualChartProps {
  budgets: ExpenseBudget[]
  categoryBreakdown: CategoryBreakdown[]
  categoryNames: Record<number, string>
}

export const BudgetVsActualChart = ({
  budgets,
  categoryBreakdown,
  categoryNames,
}: BudgetVsActualChartProps) => {
  const { t } = useTranslation('expense')

  const chartConfig = {
    budget: {
      label: t('budget.amount'),
      color: '#94a3b8',
    },
    actual: {
      label: t('totalExpense'),
      color: '#ef4444',
    },
  } satisfies ChartConfig

  const chartData = useMemo(() => {
    return budgets
      .filter((b) => b.categoryRowId)
      .map((b) => {
        const actual = categoryBreakdown.find(
          (c) => c.categoryRowId === b.categoryRowId
        )
        const name = categoryNames[b.categoryRowId!] || `카테고리 ${b.categoryRowId}`
        return {
          name: name.length > 8 ? name.slice(0, 8) + '…' : name,
          budget: b.budgetAmount,
          actual: actual?.totalAmount ?? 0,
        }
      })
      .filter((d) => d.budget > 0)
  }, [budgets, categoryBreakdown, categoryNames])

  if (budgets.length === 0 || chartData.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-sm text-muted-foreground">{t('stats.noBudgetSet')}</p>
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
      >
        <CartesianGrid horizontal={false} />
        <YAxis
          dataKey="name"
          type="category"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={11}
          width={70}
        />
        <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => {
                const label = name === 'budget' ? t('budget.amount') : t('totalExpense')
                return (
                  <div className="flex flex-1 justify-between gap-4 leading-none">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {formatCurrency(value as number)}
                    </span>
                  </div>
                )
              }}
            />
          }
        />
        <Bar dataKey="budget" fill="var(--color-budget)" radius={[0, 4, 4, 0]} barSize={12} />
        <Bar dataKey="actual" fill="var(--color-actual)" radius={[0, 4, 4, 0]} barSize={12} />
        <ChartLegend content={<ChartLegendContent />} />
      </BarChart>
    </ChartContainer>
  )
}
