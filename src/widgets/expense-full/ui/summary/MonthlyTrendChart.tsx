import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts'
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
      color: '#10b981',
    },
    expense: {
      label: t('totalExpense'),
      color: '#f43f5e',
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
    <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="statsFillIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.4} />
            <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="statsFillExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-expense)" stopOpacity={0.4} />
            <stop offset="95%" stopColor="var(--color-expense)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.3} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          fontSize={11}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          fontSize={11}
          width={45}
          tickFormatter={(v) => v >= 10000 ? (v / 10000).toFixed(0) + '만' : v.toLocaleString()}
        />
        <ChartTooltip
          cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '4 4' }}
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
          type="monotone"
          fill="url(#statsFillIncome)"
          fillOpacity={0.4}
          stroke="var(--color-income)"
          strokeWidth={2.5}
          dot={{ r: 0 }}
          activeDot={{ r: 5, strokeWidth: 2 }}
        />
        <Area
          dataKey="expense"
          type="monotone"
          fill="url(#statsFillExpense)"
          fillOpacity={0.4}
          stroke="var(--color-expense)"
          strokeWidth={2.5}
          dot={{ r: 0 }}
          activeDot={{ r: 5, strokeWidth: 2 }}
        />
        <ChartLegend content={<ChartLegendContent payload={[]} />} />
      </AreaChart>
    </ChartContainer>
  )
}
