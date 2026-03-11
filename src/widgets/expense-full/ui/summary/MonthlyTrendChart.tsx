import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AreaChart, Area, XAxis, CartesianGrid } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/shared/ui/chart'
import { formatCurrency } from '@/shared/lib'
import type { MonthlyAmount } from '@/entities/expense'

interface MonthlyTrendChartProps {
  monthlyAmounts: MonthlyAmount[]
}

export const MonthlyTrendChart = ({ monthlyAmounts }: MonthlyTrendChartProps) => {
  const { t } = useTranslation('expense')

  const chartConfig = {
    income: {
      label: t('totalIncome'),
      color: 'oklch(0.65 0.19 145)',
    },
    expense: {
      label: t('totalExpense'),
      color: 'oklch(0.63 0.22 25)',
    },
  } satisfies ChartConfig

  const chartData = useMemo(() => {
    return monthlyAmounts.map((m) => ({
      month: `${m.month}월`,
      income: m.totalIncome,
      expense: m.totalExpense,
    }))
  }, [monthlyAmounts])

  if (chartData.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-sm text-muted-foreground">{t('stats.noData')}</p>
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="statsFillIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="statsFillExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-expense)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="var(--color-expense)" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={11}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="line"
              formatter={(value, name) => {
                const label = name === 'income' ? t('totalIncome') : t('totalExpense')
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
        <Area
          dataKey="income"
          type="natural"
          fill="url(#statsFillIncome)"
          fillOpacity={0.4}
          stroke="var(--color-income)"
          strokeWidth={2}
        />
        <Area
          dataKey="expense"
          type="natural"
          fill="url(#statsFillExpense)"
          fillOpacity={0.4}
          stroke="var(--color-expense)"
          strokeWidth={2}
        />
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  )
}
