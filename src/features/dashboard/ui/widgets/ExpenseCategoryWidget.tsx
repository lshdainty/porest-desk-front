import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { PieChart, Pie, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/shared/ui/chart'
import { expenseApi } from '@/features/expense/api/expenseApi'
import { expenseKeys } from '@/shared/config'

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#6366f1', '#84cc16', '#06b6d4']

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원'
}

export const ExpenseCategoryWidget = () => {
  const { t } = useTranslation('dashboard')
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const { data, isLoading } = useQuery({
    queryKey: expenseKeys.monthlySummary(year, month),
    queryFn: () => expenseApi.getMonthlySummary(year, month),
  })

  const chartData = useMemo(() => {
    if (!data?.categoryBreakdown) return []

    const expenseCategories = data.categoryBreakdown
      .filter((c) => c.totalAmount > 0)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5)

    return expenseCategories.map((c, i) => ({
      name: c.categoryName,
      value: c.totalAmount,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }))
  }, [data])

  const totalExpense = useMemo(() => {
    return chartData.reduce((sum, c) => sum + c.value, 0)
  }, [chartData])

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {}
    chartData.forEach((item, i) => {
      config[item.name] = {
        label: item.name,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }
    })
    return config
  }, [chartData])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!data || chartData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">{t('noData')}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="relative flex flex-1 items-center justify-center">
        <ChartContainer config={chartConfig} className="aspect-square h-full max-h-[180px] w-full">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => (
                    <span className="font-mono font-medium tabular-nums">
                      {formatCurrency(value as number)}
                    </span>
                  )}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="85%"
              paddingAngle={3}
              strokeWidth={3}
              stroke="hsl(var(--background))"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">{t('total')}</p>
            <p className="text-base font-bold">{formatCurrency(totalExpense)}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {chartData.map((item, i) => (
          <div key={item.name} className="flex items-center gap-1.5 text-xs">
            <div
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="text-muted-foreground truncate max-w-[80px]">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
