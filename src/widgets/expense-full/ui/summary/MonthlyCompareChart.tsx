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
import type { MonthlyAmount } from '@/entities/expense'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('ko-KR').format(amount) + '원'

interface MonthlyCompareChartProps {
  monthlyAmounts: MonthlyAmount[]
  year: number
}

export const MonthlyCompareChart = ({ monthlyAmounts, year: _year }: MonthlyCompareChartProps) => {
  const { t } = useTranslation('expense')

  const chartConfig = {
    income: { label: t('income'), color: '#10b981' },
    expense: { label: t('expense'), color: '#f43f5e' },
  } satisfies ChartConfig

  const chartData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      const found = monthlyAmounts.find((m) => m.month === month)
      return {
        month: `${month}월`,
        income: found?.totalIncome ?? 0,
        expense: found?.totalExpense ?? 0,
      }
    })
  }, [monthlyAmounts])

  const totalIncome = chartData.reduce((sum, d) => sum + d.income, 0)
  const totalExpense = chartData.reduce((sum, d) => sum + d.expense, 0)

  if (chartData.every((d) => d.income === 0 && d.expense === 0)) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">{t('stats.noData')}</p>
      </div>
    )
  }

  return (
    <div>
      <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.3} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={11}
            width={45}
            tickFormatter={(v) => (v >= 10000 ? (v / 10000).toFixed(0) + '만' : v.toLocaleString())}
          />
          <ChartTooltip
            cursor={{ fill: 'var(--muted)', opacity: 0.3 }}
            content={
              <ChartTooltipContent
                formatter={(value, name) => (
                  <div className="flex flex-1 justify-between gap-4 leading-none">
                    <span className="text-muted-foreground">
                      {name === 'income' ? t('income') : t('expense')}
                    </span>
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {formatCurrency(value as number)}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} barSize={12} />
          <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} barSize={12} />
          <ChartLegend content={<ChartLegendContent payload={[]} />} />
        </BarChart>
      </ChartContainer>

      <div className="mt-3 flex items-center justify-between border-t pt-2 text-xs">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#10b981]" />
          <span className="text-muted-foreground">{t('income')}</span>
          <span className="font-semibold tabular-nums">{formatCurrency(totalIncome)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#f43f5e]" />
          <span className="text-muted-foreground">{t('expense')}</span>
          <span className="font-semibold tabular-nums">{formatCurrency(totalExpense)}</span>
        </div>
      </div>
    </div>
  )
}
