import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Wallet, TrendingDown, TrendingUp } from 'lucide-react'
import { AreaChart, Area, XAxis, CartesianGrid } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
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
    income: {
      label: t('chart.income'),
      color: 'oklch(0.65 0.19 145)',
    },
    expense: {
      label: t('chart.expense'),
      color: 'oklch(0.63 0.22 25)',
    },
  } satisfies ChartConfig

  if (isLoading || !data) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">{t('loading', { ns: 'common' })}</p>
      </div>
    )
  }

  const { expenseTrend, expenseSummary } = data

  const chartData = expenseTrend.map((d) => ({
    date: new Date(d.date).getDate() + '일',
    income: d.income,
    expense: d.expense,
  }))

  const net = expenseSummary.monthlyIncome - expenseSummary.monthlyExpense
  const isPositiveNet = net >= 0

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
        <ChartContainer config={chartConfig} className="aspect-auto h-48 w-full">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-expense)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-expense)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval="preserveStartEnd"
              fontSize={11}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="line"
                  formatter={(value, name) => {
                    const label = name === 'income' ? t('chart.income') : t('chart.expense')
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
              fill="url(#fillIncome)"
              fillOpacity={0.4}
              stroke="var(--color-income)"
              strokeWidth={2}
            />
            <Area
              dataKey="expense"
              type="natural"
              fill="url(#fillExpense)"
              fillOpacity={0.4}
              stroke="var(--color-expense)"
              strokeWidth={2}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </div>

      <div className="flex items-center gap-4 border-t pt-3 text-sm">
        <div>
          <span className="text-muted-foreground">{t('chart.income')}</span>
          <p className="font-semibold text-accent-green">{formatCurrency(expenseSummary.monthlyIncome)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">{t('chart.expense')}</span>
          <p className="font-semibold text-accent-red">{formatCurrency(expenseSummary.monthlyExpense)}</p>
        </div>
        <div className="ml-auto flex items-center gap-1 text-xs font-medium">
          {isPositiveNet ? (
            <TrendingUp size={14} className="text-accent-green" />
          ) : (
            <TrendingDown size={14} className="text-accent-red" />
          )}
          <span className={isPositiveNet ? 'text-accent-green' : 'text-accent-red'}>
            {isPositiveNet ? '+' : ''}{formatCurrency(net)}
          </span>
        </div>
      </div>
    </div>
  )
}
