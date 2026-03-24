import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PieChart, Pie, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/shared/ui/chart'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
import type { CategoryBreakdown, MerchantSummary, ExpenseCategory } from '@/entities/expense'
import { separateBreakdownByType, withPercentages } from '@/entities/expense'

const CHART_COLORS = [
  '#f97316', '#14b8a6', '#3b82f6', '#f59e0b', '#8b5cf6',
  '#ec4899', '#10b981', '#6366f1', '#84cc16', '#06b6d4',
]

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('ko-KR').format(amount) + '원'

interface ChartItem {
  name: string
  value: number
  percentage: number
  fill: string
}

const DonutWithList = ({ data, total, chartConfig, noDataLabel }: {
  data: ChartItem[]
  total: number
  chartConfig: ChartConfig
  noDataLabel: string
}) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">{noDataLabel}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="relative flex items-center justify-center">
        <ChartContainer config={chartConfig} className="aspect-square max-h-[200px] w-full">
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
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="85%"
              paddingAngle={3}
              strokeWidth={3}
              stroke="hsl(var(--background))"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-bold">{formatCurrency(total)}</p>
          </div>
        </div>
      </div>

      <div className="mt-3">
        {data.map((item, i) => (
          <div key={item.name} className="flex items-center gap-3 border-b py-2.5 last:border-b-0">
            <div
              className="h-8 w-1 shrink-0 rounded-full"
              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="flex-1 truncate text-sm font-medium">{item.name}</span>
            <span className="text-sm font-bold tabular-nums">{formatCurrency(item.value)}</span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
              {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface ExpenseCategoryChartProps {
  categoryBreakdown: CategoryBreakdown[]
  merchants: MerchantSummary[]
  categories?: ExpenseCategory[]
}

export const ExpenseCategoryChart = ({ categoryBreakdown, merchants, categories }: ExpenseCategoryChartProps) => {
  const { t } = useTranslation('expense')

  const categoryChartData = useMemo(() => {
    if (!categoryBreakdown.length || !categories) return []

    const { expenseBreakdown } = separateBreakdownByType(categoryBreakdown, categories)
    const ranked = withPercentages(expenseBreakdown)
      .filter((c) => c.totalAmount > 0)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5)

    return ranked.map((c, i) => ({
      name: c.categoryName,
      value: c.totalAmount,
      percentage: c.percentage,
      fill: CHART_COLORS[i % CHART_COLORS.length] ?? '#6b7280',
    }))
  }, [categoryBreakdown, categories])

  const categoryTotal = useMemo(() => {
    if (!categoryBreakdown.length || !categories) return 0
    const { expenseBreakdown } = separateBreakdownByType(categoryBreakdown, categories)
    return expenseBreakdown.reduce((sum, c) => sum + c.totalAmount, 0)
  }, [categoryBreakdown, categories])

  const categoryConfig = useMemo(() => {
    const config: ChartConfig = {}
    categoryChartData.forEach((item, i) => {
      config[item.name] = { label: item.name, color: CHART_COLORS[i % CHART_COLORS.length] }
    })
    return config
  }, [categoryChartData])

  const merchantChartData = useMemo(() => {
    if (!merchants.length) return []

    const sorted = [...merchants].sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 5)
    const total = sorted.reduce((sum, m) => sum + m.totalAmount, 0)
    if (total === 0) return []

    return sorted.map((m, i) => ({
      name: m.merchant,
      value: m.totalAmount,
      percentage: Math.round((m.totalAmount / total) * 1000) / 10,
      fill: CHART_COLORS[i % CHART_COLORS.length] ?? '#6b7280',
    }))
  }, [merchants])

  const merchantTotal = merchantChartData.reduce((sum, m) => sum + m.value, 0)

  const merchantConfig = useMemo(() => {
    const config: ChartConfig = {}
    merchantChartData.forEach((item, i) => {
      config[item.name] = { label: item.name, color: CHART_COLORS[i % CHART_COLORS.length] }
    })
    return config
  }, [merchantChartData])

  return (
    <Tabs defaultValue="category">
      <div className="flex justify-center">
        <TabsList>
          <TabsTrigger value="category">{t('category')}</TabsTrigger>
          <TabsTrigger value="merchant">{t('form.merchant')}</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="category" className="mt-3">
        <DonutWithList
          data={categoryChartData}
          total={categoryTotal}
          chartConfig={categoryConfig}
          noDataLabel={t('stats.noData')}
        />
      </TabsContent>

      <TabsContent value="merchant" className="mt-3">
        <DonutWithList
          data={merchantChartData}
          total={merchantTotal}
          chartConfig={merchantConfig}
          noDataLabel={t('stats.noMerchantData')}
        />
      </TabsContent>
    </Tabs>
  )
}
