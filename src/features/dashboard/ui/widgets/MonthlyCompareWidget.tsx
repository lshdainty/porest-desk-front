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
import { useYearlySummary } from '@/features/expense'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원'
}

export const MonthlyCompareWidget = () => {
  const { t } = useTranslation('dashboard')
  const now = new Date()
  const year = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const chartConfig = {
    income: {
      label: t('chart.income'),
      color: '#10b981',
    },
    expense: {
      label: t('chart.expense'),
      color: '#f43f5e',
    },
  } satisfies ChartConfig

  const { data, isLoading } = useYearlySummary(year)

  const chartData = useMemo(() => {
    if (!data?.monthlyAmounts) return []

    // 1월~현재월까지 전체 표시 (데이터 없는 달도 0으로)
    return Array.from({ length: currentMonth }, (_, i) => {
      const month = i + 1
      const found = data.monthlyAmounts.find((m) => m.month === month)
      return {
        month: `${month}월`,
        income: found?.totalIncome ?? 0,
        expense: found?.totalExpense ?? 0,
      }
    })
  }, [data, currentMonth])

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

  // 합산 요약
  const totalIncome = chartData.reduce((sum, d) => sum + d.income, 0)
  const totalExpense = chartData.reduce((sum, d) => sum + d.expense, 0)

  return (
    <div className="flex h-full flex-col overflow-hidden p-3">
      {/* 차트 */}
      <div className="min-h-0 flex-1">
        <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.3} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={11}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={11}
              width={45}
              tickFormatter={(v) =>
                v >= 10000 ? (v / 10000).toFixed(0) + '만' : v.toLocaleString()
              }
            />
            <ChartTooltip
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    const label =
                      name === 'income' ? chartConfig.income.label : chartConfig.expense.label
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
            <Bar
              dataKey="income"
              fill="var(--color-income)"
              radius={[4, 4, 0, 0]}
              barSize={currentMonth <= 6 ? 20 : 14}
            />
            <Bar
              dataKey="expense"
              fill="var(--color-expense)"
              radius={[4, 4, 0, 0]}
              barSize={currentMonth <= 6 ? 20 : 14}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
      </div>

      {/* 연간 합산 요약 */}
      <div className="flex shrink-0 items-center justify-between border-t pt-2 text-xs">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#10b981]" />
          <span className="text-muted-foreground">{t('chart.income')}</span>
          <span className="font-semibold tabular-nums">{formatCurrency(totalIncome)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#f43f5e]" />
          <span className="text-muted-foreground">{t('chart.expense')}</span>
          <span className="font-semibold tabular-nums">{formatCurrency(totalExpense)}</span>
        </div>
      </div>
    </div>
  )
}
