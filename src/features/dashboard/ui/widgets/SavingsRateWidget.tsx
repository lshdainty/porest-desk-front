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
import { useYearlySummary } from '@/features/expense'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원'
}

const MONTH_LABELS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

export const SavingsRateWidget = () => {
  const { t } = useTranslation('dashboard')
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const { data: thisYearData, isLoading: loadingThis } = useYearlySummary(currentYear)
  const { data: lastYearData, isLoading: loadingLast } = useYearlySummary(currentYear - 1)

  // 최근 6개월 데이터
  const chartData = useMemo(() => {
    if (!thisYearData && !lastYearData) return []

    const months: Array<{
      label: string
      income: number
      expense: number
      savingsRate: number
      savings: number
    }> = []

    for (let i = 5; i >= 0; i--) {
      let targetMonth = currentMonth - i
      let targetYear = currentYear

      if (targetMonth <= 0) {
        targetMonth += 12
        targetYear -= 1
      }

      const yearData = targetYear === currentYear ? thisYearData : lastYearData
      const monthData = yearData?.monthlyAmounts?.find((m) => m.month === targetMonth)

      const income = monthData?.totalIncome ?? 0
      const expense = monthData?.totalExpense ?? 0
      const savings = income - expense
      const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 1000) / 10 : 0

      months.push({
        label: MONTH_LABELS[targetMonth - 1],
        income,
        expense,
        savingsRate,
        savings,
      })
    }

    return months
  }, [thisYearData, lastYearData, currentYear, currentMonth])

  const chartConfig = {
    savingsRate: {
      label: t('savings.rate'),
      color: '#10b981',
    },
  } satisfies ChartConfig

  // 이번 달 / 전월 비교
  const currentMonthData = chartData.length > 0 ? chartData[chartData.length - 1] : null
  const prevMonthData = chartData.length > 1 ? chartData[chartData.length - 2] : null
  const rateDiff = currentMonthData && prevMonthData
    ? Math.round((currentMonthData.savingsRate - prevMonthData.savingsRate) * 10) / 10
    : 0

  if (loadingThis || loadingLast) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (chartData.length === 0 || chartData.every((d) => d.income === 0)) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">{t('noData')}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col p-4">
      {/* 헤더 */}
      <div className="flex shrink-0 items-center justify-between">
        <h3 className="text-sm font-semibold">{t('savings.title')}</h3>
        <span className="text-xs text-muted-foreground">{t('savings.last6months')}</span>
      </div>

      {/* Area 차트 */}
      <div className="mt-2 flex-1">
        <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillSavingsRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-savingsRate)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-savingsRate)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.3} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              fontSize={11}
            />
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
                          <span className="text-muted-foreground">{t('savings.rate')}</span>
                          <span className="font-mono font-medium tabular-nums">{Number(value).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">{t('chart.income')}</span>
                          <span className="font-mono text-xs tabular-nums">{formatCurrency(d.income)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">{t('chart.expense')}</span>
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
              fill="url(#fillSavingsRate)"
              fillOpacity={0.4}
              stroke="var(--color-savingsRate)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: 'var(--color-savingsRate)', strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
          </AreaChart>
        </ChartContainer>
      </div>

      {/* 이번 달 요약 */}
      {currentMonthData && (
        <div className="mt-3 shrink-0 rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('savings.thisMonth')}</span>
            <div className="flex items-center gap-1">
              <span
                className={`text-xl font-bold tabular-nums ${
                  currentMonthData.savingsRate >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
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
            <span>
              {t('chart.income')}: <strong className="text-foreground">{formatCurrency(currentMonthData.income)}</strong>
            </span>
            <span>
              {t('chart.expense')}: <strong className="text-foreground">{formatCurrency(currentMonthData.expense)}</strong>
            </span>
          </div>
          <div className="mt-1 text-xs">
            <span className="text-muted-foreground">{t('savings.amount')}: </span>
            <strong className={currentMonthData.savings >= 0 ? 'text-emerald-600' : 'text-red-600'}>
              {currentMonthData.savings >= 0 ? '+' : ''}{formatCurrency(currentMonthData.savings)}
            </strong>
          </div>
        </div>
      )}
    </div>
  )
}
