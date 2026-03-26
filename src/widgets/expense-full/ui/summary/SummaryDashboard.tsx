import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts'
import { cn, formatCurrency } from '@/shared/lib'
import { useIsMobile } from '@/shared/hooks'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/shared/ui/chart'
import {
  useExpenses,
  useYearlySummary,
  useExpenseCategories,
  useMonthlySummary,
} from '@/features/expense'
import { separateBreakdownByType, aggregateByParent } from '@/entities/expense'
import type { CategoryBreakdown, Expense } from '@/entities/expense'
import { DailyExpenseHeatmap } from './DailyExpenseHeatmap'

const CHART_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
]

interface SummaryDashboardProps {
  year: number
  month: number
  onNavigateToList?: (categoryId?: number) => void
}

/** Format compact amount for axis labels */
const formatCompact = (v: number) => {
  if (v >= 10000) return `${(v / 10000).toFixed(0)}만`
  return v.toLocaleString()
}

const formatAmount = (amount: number) =>
  new Intl.NumberFormat('ko-KR').format(amount) + '원'

export const SummaryDashboard = ({ year, month, onNavigateToList }: SummaryDashboardProps) => {
  const { t } = useTranslation('expense')
  const isMobile = useIsMobile()
  const [trendPeriod, setTrendPeriod] = useState<'7d' | '30d'>('30d')

  // Data
  const lastDay = new Date(year, month, 0).getDate()
  const monthStartDate = `${year}-${String(month).padStart(2, '0')}-01`
  const monthEndDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const { data: monthExpenses } = useExpenses({ startDate: monthStartDate, endDate: monthEndDate })
  const { data: categories } = useExpenseCategories()
  const { data: summary } = useMonthlySummary(year, month)
  const { data: yearlyData } = useYearlySummary(year)

  const categoryBreakdown: CategoryBreakdown[] = useMemo(() => {
    if (!yearlyData?.monthlyAmounts) return []
    const currentMonth = yearlyData.monthlyAmounts.find((m) => m.month === month)
    return currentMonth?.categoryBreakdown ?? []
  }, [yearlyData, month])

  // 1. Donut chart data (top 5 + others)
  const { donutData, donutTotal, chartConfig: donutConfig } = useMemo(() => {
    const { expenseBreakdown } = separateBreakdownByType(categoryBreakdown, categories ?? [])
    const parentBreakdown = aggregateByParent(expenseBreakdown)
    const sorted = parentBreakdown
      .filter((p) => p.totalAmount > 0)
      .sort((a, b) => b.totalAmount - a.totalAmount)

    const top5 = sorted.slice(0, 5)
    const othersAmount = sorted.slice(5).reduce((sum, p) => sum + p.totalAmount, 0)

    const data = top5.map((p, i) => ({
      name: p.categoryName,
      value: p.totalAmount,
      fill: CHART_COLORS[i % CHART_COLORS.length],
      rowId: p.categoryRowId,
    }))

    if (othersAmount > 0) {
      data.push({
        name: t('stats.others'),
        value: othersAmount,
        fill: '#9ca3af',
        rowId: -1,
      })
    }

    const total = data.reduce((sum, d) => sum + d.value, 0)

    const config: ChartConfig = {}
    data.forEach((item) => {
      config[item.name] = { label: item.name, color: item.fill }
    })

    return { donutData: data, donutTotal: total, chartConfig: config }
  }, [categoryBreakdown, categories, t])

  // 2. Daily expense trend
  const dailyTrendData = useMemo(() => {
    if (!monthExpenses) return []
    const dailyMap = new Map<string, number>()
    monthExpenses
      .filter((e: Expense) => e.expenseType === 'EXPENSE')
      .forEach((e: Expense) => {
        dailyMap.set(e.expenseDate, (dailyMap.get(e.expenseDate) ?? 0) + e.amount)
      })

    const sorted = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({
        date: `${new Date(date).getMonth() + 1}/${new Date(date).getDate()}`,
        expense: amount,
      }))

    if (trendPeriod === '7d') {
      return sorted.slice(-7)
    }
    return sorted
  }, [monthExpenses, trendPeriod])

  const trendConfig = {
    expense: { label: t('expense'), color: '#f43f5e' },
  } satisfies ChartConfig

  // 3. Top categories bar chart (top 5)
  const topCategoriesData = useMemo(() => {
    const { expenseBreakdown } = separateBreakdownByType(categoryBreakdown, categories ?? [])
    const parentBreakdown = aggregateByParent(expenseBreakdown)
    return parentBreakdown
      .filter((p) => p.totalAmount > 0)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5)
      .map((p, i) => ({
        name: p.categoryName.length > 6 ? p.categoryName.slice(0, 6) + '...' : p.categoryName,
        fullName: p.categoryName,
        amount: p.totalAmount,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      }))
  }, [categoryBreakdown, categories])

  const barConfig = {
    amount: { label: t('expense'), color: '#3b82f6' },
  } satisfies ChartConfig

  return (
    <div className="space-y-4">
      {/* 1. Category Donut Chart */}
      <div className="rounded-xl border bg-card p-4 sm:p-5">
        <h3 className="mb-4 text-sm font-semibold">{t('stats.categoryExpense')}</h3>

        {donutData.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t('stats.noData')}</p>
        ) : (
          <div className={isMobile ? 'space-y-4' : 'grid grid-cols-2 gap-6'}>
            {/* Donut */}
            <div className="relative flex items-center justify-center">
              <ChartContainer config={donutConfig} className="aspect-square max-h-[200px] w-full">
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
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="55%"
                    outerRadius="85%"
                    paddingAngle={3}
                    strokeWidth={2}
                    stroke="hsl(var(--background))"
                    className="cursor-pointer"
                    onClick={(_, index) => {
                      const item = donutData[index]
                      if (item && item.rowId > 0 && onNavigateToList) {
                        onNavigateToList(item.rowId)
                      }
                    }}
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              {/* Center total */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">{t('totalExpense')}</p>
                  <p className="text-base sm:text-lg font-bold tabular-nums">{formatCurrency(donutTotal)}</p>
                </div>
              </div>
            </div>

            {/* Legend list */}
            <div className="flex flex-col justify-center space-y-1.5">
              {donutData.map((item) => {
                const pct = donutTotal > 0 ? Math.round((item.value / donutTotal) * 100) : 0
                return (
                  <div
                    key={item.name}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => {
                      if (item.rowId > 0 && onNavigateToList) onNavigateToList(item.rowId)
                    }}
                  >
                    <div
                      className="h-3 w-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="flex-1 truncate text-sm">{item.name}</span>
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">{pct}%</span>
                    <span className="text-sm font-medium tabular-nums">{formatCurrency(item.value)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Daily Expense Trend (AreaChart) */}
      <div className="rounded-xl border bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">{t('stats.dailyTrend')}</h3>
          <div className="flex rounded-lg border bg-muted/30 p-0.5">
            <button
              onClick={() => setTrendPeriod('7d')}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                trendPeriod === '7d'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t('stats.last7days')}
            </button>
            <button
              onClick={() => setTrendPeriod('30d')}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                trendPeriod === '30d'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t('stats.last30days')}
            </button>
          </div>
        </div>

        {dailyTrendData.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t('stats.noData')}</p>
        ) : (
          <ChartContainer config={trendConfig} className="aspect-auto h-52 w-full">
            <AreaChart data={dailyTrendData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fillDailyExpenseSummary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-expense)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-expense)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval="preserveStartEnd"
                fontSize={10}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={10}
                width={40}
                tickFormatter={formatCompact}
              />
              <ChartTooltip
                cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    formatter={(value) => (
                      <span className="font-mono font-medium tabular-nums">
                        {formatAmount(value as number)}
                      </span>
                    )}
                  />
                }
              />
              <Area
                dataKey="expense"
                type="monotone"
                fill="url(#fillDailyExpenseSummary)"
                fillOpacity={1}
                stroke="var(--color-expense)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </div>

      {/* 3. Top Categories Bar Chart */}
      <div className="rounded-xl border bg-card p-4 sm:p-5">
        <h3 className="mb-4 text-sm font-semibold">{t('stats.topCategories')}</h3>

        {topCategoriesData.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t('stats.noData')}</p>
        ) : (
          <ChartContainer config={barConfig} className="aspect-auto h-48 w-full">
            <BarChart data={topCategoriesData} layout="vertical" margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis type="number" tickLine={false} axisLine={false} fontSize={10} tickFormatter={formatCompact} />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={70}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    nameKey="fullName"
                    formatter={(value) => (
                      <span className="font-mono font-medium tabular-nums">
                        {formatAmount(value as number)}
                      </span>
                    )}
                  />
                }
              />
              <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={20}>
                {topCategoriesData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </div>

      {/* 4. Daily Expense Heatmap Calendar */}
      <DailyExpenseHeatmap
        expenses={monthExpenses || []}
        year={year}
        month={month}
      />
    </div>
  )
}
