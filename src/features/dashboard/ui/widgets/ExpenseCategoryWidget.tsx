import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { PieChart, Pie, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/shared/ui/chart'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
import { expenseApi } from '@/features/expense/api/expenseApi'
import { useExpenseCategories } from '@/features/expense'
import { separateBreakdownByType, withPercentages } from '@/entities/expense'
import { expenseKeys } from '@/shared/config'

const CHART_COLORS = [
  '#f97316', '#14b8a6', '#3b82f6', '#f59e0b', '#8b5cf6',
  '#ec4899', '#10b981', '#6366f1', '#84cc16', '#06b6d4',
]

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원'
}

interface ChartItem {
  name: string
  value: number
  percentage: number
  fill: string
}

const DonutWithList = ({
  data,
  total,
  chartConfig,
  headerLabel,
  totalLabel,
  noDataLabel,
}: {
  data: ChartItem[]
  total: number
  chartConfig: ChartConfig
  headerLabel: string
  totalLabel: string
  noDataLabel: string
}) => {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">{noDataLabel}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* 도넛 차트 (고정) */}
      <div className="relative flex shrink-0 items-center justify-center">
        <ChartContainer config={chartConfig} className="aspect-square h-full max-h-[200px] w-full">
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
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-lg font-bold">{formatCurrency(total)}</p>
            <p className="text-xs text-muted-foreground">{totalLabel}</p>
          </div>
        </div>
      </div>

      {/* 헤더 + 리스트 영역 (리스트만 스크롤) */}
      <div className="flex min-h-0 flex-1 flex-col">
        {/* 헤더 행 (고정) */}
        <div className="flex shrink-0 items-center justify-between border-b pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <span>{headerLabel}</span>
          <span>금액 / 비율</span>
        </div>

        {/* 상세 리스트 (스크롤) */}
        <div className="flex-1 overflow-y-auto">
          {data.map((item, i) => (
            <div
              key={item.name}
              className="flex items-center gap-3 border-b py-3 last:border-b-0"
            >
              <div
                className="h-8 w-1 shrink-0 rounded-full"
                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              <span className="flex-1 truncate text-sm font-medium">{item.name}</span>
              <span className="text-sm font-bold tabular-nums">
                {formatCurrency(item.value)}
              </span>
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const ExpenseCategoryWidget = () => {
  const { t } = useTranslation('dashboard')
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(
    new Date(year, month, 0).getDate(),
  ).padStart(2, '0')}`

  // 카테고리 데이터
  const { data: summaryData, isLoading: loadingSummary } = useQuery({
    queryKey: expenseKeys.monthlySummary(year, month),
    queryFn: () => expenseApi.getMonthlySummary(year, month),
  })
  const { data: categories } = useExpenseCategories()

  // 가맹점 데이터
  const { data: merchantData, isLoading: loadingMerchant } = useQuery({
    queryKey: expenseKeys.merchantSummary({ startDate, endDate }),
    queryFn: () => expenseApi.getMerchantSummary(startDate, endDate),
  })

  // 카테고리 차트 데이터
  const categoryChartData = useMemo(() => {
    if (!summaryData?.categoryBreakdown || !categories) return []

    const { expenseBreakdown } = separateBreakdownByType(summaryData.categoryBreakdown, categories)
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
  }, [summaryData, categories])

  const categoryTotal = useMemo(() => {
    if (!summaryData?.categoryBreakdown || !categories) return 0
    const { expenseBreakdown } = separateBreakdownByType(summaryData.categoryBreakdown, categories)
    return expenseBreakdown.reduce((sum, c) => sum + c.totalAmount, 0)
  }, [summaryData, categories])

  const categoryConfig = useMemo(() => {
    const config: ChartConfig = {}
    categoryChartData.forEach((item, i) => {
      config[item.name] = {
        label: item.name,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }
    })
    return config
  }, [categoryChartData])

  // 가맹점 차트 데이터
  const merchantChartData = useMemo(() => {
    if (!merchantData?.merchants) return []

    const sorted = [...merchantData.merchants]
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5)

    const total = sorted.reduce((sum, m) => sum + m.totalAmount, 0)
    if (total === 0) return []

    return sorted.map((m, i) => ({
      name: m.merchant,
      value: m.totalAmount,
      percentage: Math.round((m.totalAmount / total) * 1000) / 10,
      fill: CHART_COLORS[i % CHART_COLORS.length] ?? '#6b7280',
    }))
  }, [merchantData])

  const merchantTotal = useMemo(() => {
    return merchantChartData.reduce((sum, m) => sum + m.value, 0)
  }, [merchantChartData])

  const merchantConfig = useMemo(() => {
    const config: ChartConfig = {}
    merchantChartData.forEach((item, i) => {
      config[item.name] = {
        label: item.name,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }
    })
    return config
  }, [merchantChartData])

  if (loadingSummary && loadingMerchant) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden p-4">
      <Tabs defaultValue="category" className="flex min-h-0 flex-1 flex-col">
        <div className="flex justify-center">
          <TabsList>
            <TabsTrigger value="category">{t('widget.byCategory')}</TabsTrigger>
            <TabsTrigger value="merchant">{t('widget.byMerchant')}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="category" className="min-h-0 flex-1 overflow-hidden">
          <DonutWithList
            data={categoryChartData}
            total={categoryTotal}
            chartConfig={categoryConfig}
            headerLabel={t('widget.categoryLabel')}
            totalLabel={t('widget.totalExpense')}
            noDataLabel={t('noData')}
          />
        </TabsContent>

        <TabsContent value="merchant" className="min-h-0 flex-1 overflow-hidden">
          <DonutWithList
            data={merchantChartData}
            total={merchantTotal}
            chartConfig={merchantConfig}
            headerLabel={t('widget.merchantLabel')}
            totalLabel={t('widget.totalExpense')}
            noDataLabel={t('noData')}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
