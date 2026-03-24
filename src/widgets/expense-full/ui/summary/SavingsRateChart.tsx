import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/shared/ui/chart'
import type { MonthlyAmount } from '@/entities/expense'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('ko-KR').format(amount) + '원'

const MONTH_LABELS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

interface SavingsRateChartProps {
  currentYearData: MonthlyAmount[]
  previousYearData: MonthlyAmount[]
  year: number
  month: number
}

export const SavingsRateChart = ({ currentYearData, previousYearData, year, month }: SavingsRateChartProps) => {
  const { t } = useTranslation('expense')

  const chartConfig = {
    savingsRate: { label: t('stats.savingsRate'), color: '#10b981' },
  } satisfies ChartConfig

  const chartData = useMemo(() => {
    const months: Array<{
      label: string
      income: number
      expense: number
      savingsRate: number
      savings: number
    }> = []

    for (let i = 5; i >= 0; i--) {
      let targetMonth = month - i
      let targetYear = year

      if (targetMonth <= 0) {
        targetMonth += 12
        targetYear -= 1
      }

      const yearData = targetYear === year ? currentYearData : previousYearData
      const monthData = yearData?.find((m) => m.month === targetMonth)

      const income = monthData?.totalIncome ?? 0
      const expense = monthData?.totalExpense ?? 0
      const savings = income - expense
      const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 1000) / 10 : 0

      months.push({
        label: MONTH_LABELS[targetMonth - 1] ?? `${targetMonth}월`,
        income,
        expense,
        savingsRate,
        savings,
      })
    }

    return months
  }, [currentYearData, previousYearData, year, month])

  const currentMonthData = chartData.length > 0 ? chartData[chartData.length - 1] : null
  const prevMonthData = chartData.length > 1 ? chartData[chartData.length - 2] : null
  const rateDiff = currentMonthData && prevMonthData
    ? Math.round((currentMonthData.savingsRate - prevMonthData.savingsRate) * 10) / 10
    : 0

  if (chartData.length === 0 || chartData.every((d) => d.income === 0)) {
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
            <linearGradient id="fillSavingsRateSummary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-savingsRate)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="var(--color-savingsRate)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.3} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} fontSize={11} />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={11}
            width={35}
            tickFormatter={(v) => `${v}%`}
            domain={[
              (dataMin: number) => Math.min(Math.floor(dataMin / 10) * 10, 0),
              (dataMax: number) => Math.max(Math.ceil(dataMax / 10) * 10, 100),
            ]}
          />
          <ChartTooltip
            cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }}
            content={
              <ChartTooltipContent
                formatter={(value, _name, entry) => {
                  const d = entry.payload
                  return (
                    <div className="space-y-1">
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">{t('stats.savingsRate')}</span>
                        <span className="font-mono font-medium tabular-nums">{Number(value).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">{t('income')}</span>
                        <span className="font-mono text-xs tabular-nums">{formatCurrency(d.income)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">{t('expense')}</span>
                        <span className="font-mono text-xs tabular-nums">{formatCurrency(d.expense)}</span>
                      </div>
                    </div>
                  )
                }}
              />
            }
          />
          <Area
            dataKey="savingsRate"
            type="monotone"
            fill="url(#fillSavingsRateSummary)"
            fillOpacity={0.4}
            stroke="var(--color-savingsRate)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: 'var(--color-savingsRate)', strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />
        </AreaChart>
      </ChartContainer>

      {currentMonthData && (
        <div className="mt-3 rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('monthly')}</span>
            <div className="flex items-center gap-1">
              <span className={`text-xl font-bold tabular-nums ${currentMonthData.savingsRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {currentMonthData.savingsRate}%
              </span>
              {rateDiff !== 0 && (
                <div className={`flex items-center gap-0.5 text-xs ${rateDiff > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {rateDiff > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <span>{rateDiff > 0 ? '+' : ''}{rateDiff}%p</span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
            <span>{t('income')}: <strong className="text-foreground">{formatCurrency(currentMonthData.income)}</strong></span>
            <span>{t('expense')}: <strong className="text-foreground">{formatCurrency(currentMonthData.expense)}</strong></span>
          </div>
          <div className="mt-1 text-xs">
            <span className="text-muted-foreground">{t('net')}: </span>
            <strong className={currentMonthData.savings >= 0 ? 'text-emerald-600' : 'text-red-600'}>
              {currentMonthData.savings >= 0 ? '+' : ''}{formatCurrency(currentMonthData.savings)}
            </strong>
          </div>
        </div>
      )}
    </div>
  )
}
