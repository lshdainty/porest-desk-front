import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Wallet } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/shared/ui/chart'
import { useDashboardSummary } from '@/features/dashboard/model/useDashboardSummary'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원'
}

export const ExpenseTrendWidget = () => {
  const { t } = useTranslation('dashboard')
  const navigate = useNavigate()
  const { data, isLoading } = useDashboardSummary()

  const chartConfig = {
    expense: {
      label: t('chart.expense'),
      color: '#f43f5e',
    },
  } satisfies ChartConfig

  if (isLoading || !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const { expenseTrend, expenseSummary } = data

  const chartData = expenseTrend.map((d) => ({
    date: new Date(d.date).getDate() + '일',
    expense: d.expense,
  }))

  const totalExpense30d = expenseTrend.reduce((sum, d) => sum + d.expense, 0)
  const daysWithExpense = expenseTrend.filter((d) => d.expense > 0).length
  const dailyAvg = daysWithExpense > 0 ? Math.round(totalExpense30d / daysWithExpense) : 0

  return (
    <div className="flex h-full flex-col p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet size={18} className="text-accent-red" />
          <h3 className="font-semibold">{t('chart.title')}</h3>
          <span className="text-xs text-muted-foreground">{t('chart.last30days')}</span>
        </div>
        <button
          onClick={() => navigate('/desk/expense')}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          {t('viewAll')}
          <ArrowRight size={12} />
        </button>
      </div>

      <div className="mt-2 flex-1">
        <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
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
              tickFormatter={(v) => v >= 10000 ? (v / 10000).toFixed(0) + '만' : v.toLocaleString()}
            />
            <ChartTooltip
              cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '4 4' }}
              content={
                <ChartTooltipContent
                  indicator="line"
                  formatter={(value) => (
                    <div className="flex flex-1 justify-between gap-4 leading-none">
                      <span className="text-muted-foreground">{t('chart.expense')}</span>
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
              fill="url(#fillExpense)"
              fillOpacity={0.4}
              stroke="var(--color-expense)"
              strokeWidth={2.5}
              dot={{ r: 0 }}
              activeDot={{ r: 5, strokeWidth: 2 }}
            />
          </AreaChart>
        </ChartContainer>
      </div>

      <div className="flex items-center gap-6 border-t pt-3 text-sm">
        <div>
          <span className="text-xs text-muted-foreground">{t('chart.expense')}</span>
          <p className="font-semibold tabular-nums text-accent-red">{formatCurrency(expenseSummary.monthlyExpense)}</p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">{t('calendar.dailyAvg')}</span>
          <p className="font-semibold tabular-nums text-foreground">{formatCurrency(dailyAvg)}</p>
        </div>
      </div>
    </div>
  )
}
