import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/shared/ui/chart'
import type { Expense } from '@/entities/expense'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('ko-KR').format(amount) + '원'

interface ExpenseDailyTrendChartProps {
  expenses: Expense[]
}

export const ExpenseDailyTrendChart = ({ expenses }: ExpenseDailyTrendChartProps) => {
  const { t } = useTranslation('expense')

  const chartConfig = {
    expense: { label: t('expense'), color: '#f43f5e' },
  } satisfies ChartConfig

  const { chartData, totalExpense, dailyAvg } = useMemo(() => {
    const dailyMap = new Map<string, number>()

    expenses
      .filter((e) => e.expenseType === 'EXPENSE')
      .forEach((e) => {
        dailyMap.set(e.expenseDate, (dailyMap.get(e.expenseDate) ?? 0) + e.amount)
      })

    const sorted = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({
        date: `${new Date(date).getMonth() + 1}/${new Date(date).getDate()}`,
        expense: amount,
      }))

    const total = sorted.reduce((sum, d) => sum + d.expense, 0)
    const avg = sorted.length > 0 ? Math.round(total / sorted.length) : 0

    return { chartData: sorted, totalExpense: total, dailyAvg: avg }
  }, [expenses])

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">{t('stats.noData')}</p>
      </div>
    )
  }

  return (
    <div>
      <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="fillDailyExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-expense)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="var(--color-expense)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.3} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            interval="preserveStartEnd"
            fontSize={11}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={11}
            width={45}
            tickFormatter={(v) => (v >= 10000 ? (v / 10000).toFixed(0) + '만' : v.toLocaleString())}
          />
          <ChartTooltip
            cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }}
            content={
              <ChartTooltipContent
                indicator="line"
                formatter={(value) => (
                  <div className="flex flex-1 justify-between gap-4 leading-none">
                    <span className="text-muted-foreground">{t('expense')}</span>
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {formatCurrency(value as number)}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Area
            dataKey="expense"
            type="monotone"
            fill="url(#fillDailyExpense)"
            fillOpacity={0.4}
            stroke="var(--color-expense)"
            strokeWidth={2.5}
            dot={{ r: 0 }}
            activeDot={{ r: 5, strokeWidth: 2 }}
          />
        </AreaChart>
      </ChartContainer>

      <div className="mt-3 flex items-center gap-6 border-t pt-3 text-sm">
        <div>
          <span className="text-xs text-muted-foreground">{t('totalExpense')}</span>
          <p className="font-semibold tabular-nums text-red-600">{formatCurrency(totalExpense)}</p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">{t('daily')}</span>
          <p className="font-semibold tabular-nums">{formatCurrency(dailyAvg)}</p>
        </div>
      </div>
    </div>
  )
}
