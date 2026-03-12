import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { PieChart, Pie, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/shared/ui/chart'
import { expenseApi } from '@/features/expense/api/expenseApi'
import { useExpenseCategories } from '@/features/expense'
import { separateBreakdownByType, withPercentages } from '@/entities/expense'
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
  const { data: categories } = useExpenseCategories()

  // 지출 카테고리만 분리하여 차트 데이터 생성
  const chartData = useMemo(() => {
    if (!data?.categoryBreakdown || !categories) return []

    const { expenseBreakdown } = separateBreakdownByType(data.categoryBreakdown, categories)
    const ranked = withPercentages(expenseBreakdown)
      .filter((c) => c.totalAmount > 0)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5)

    return ranked.map((c, i) => ({
      name: c.categoryName,
      value: c.totalAmount,
      percentage: c.percentage,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }))
  }, [data, categories])

  // 전체 지출 합산 (top 5만이 아닌 전체)
  const totalExpense = useMemo(() => {
    if (!data?.categoryBreakdown || !categories) return 0
    const { expenseBreakdown } = separateBreakdownByType(data.categoryBreakdown, categories)
    return expenseBreakdown.reduce((sum, c) => sum + c.totalAmount, 0)
  }, [data, categories])

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
    <div className="flex h-full flex-col gap-3 p-3">
      <div className="relative flex shrink-0 items-center justify-center">
        <ChartContainer config={chartConfig} className="aspect-square h-full max-h-[160px] w-full">
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

      {/* 상세 리스트: 카테고리명 + 금액 + 비율 */}
      <div className="flex flex-col gap-2">
        {chartData.map((item, i) => (
          <div key={item.name} className="flex items-center gap-2 text-xs">
            <div
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="flex-1 truncate">{item.name}</span>
            <span className="font-mono font-medium tabular-nums">
              {formatCurrency(item.value)}
            </span>
            <span className="w-12 text-right text-muted-foreground tabular-nums">
              {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
