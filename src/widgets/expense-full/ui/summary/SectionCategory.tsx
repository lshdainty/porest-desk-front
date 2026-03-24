import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { PieChart, Pie, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/shared/ui/chart'
import { useIsMobile } from '@/shared/hooks'
import { formatCurrency } from '@/shared/lib'
import { separateBreakdownByType, aggregateByParent } from '@/entities/expense'
import type { CategoryBreakdown, ExpenseCategory } from '@/entities/expense'
import { CategoryDrillDown } from './CategoryDrillDown'
import { CategoryTrendChart } from './CategoryTrendChart'
import type { MonthlyAmount } from '@/entities/expense'

const CHART_COLORS = [
  '#f97316', '#14b8a6', '#3b82f6', '#f59e0b', '#8b5cf6',
  '#ec4899', '#10b981', '#6366f1', '#84cc16', '#06b6d4',
]

interface SectionCategoryProps {
  categoryBreakdown: CategoryBreakdown[]
  categories?: ExpenseCategory[]
  filteredMonthlyAmounts: MonthlyAmount[]
  onViewTransactions?: (categoryId: number) => void
}

export const SectionCategory = ({
  categoryBreakdown,
  categories,
  filteredMonthlyAmounts,
  onViewTransactions,
}: SectionCategoryProps) => {
  const { t } = useTranslation('expense')
  const isMobile = useIsMobile()
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null)

  const { expenseBreakdown } = useMemo(
    () => separateBreakdownByType(categoryBreakdown, categories ?? []),
    [categoryBreakdown, categories],
  )

  const parentBreakdown = useMemo(() => aggregateByParent(expenseBreakdown), [expenseBreakdown])

  const ranked = useMemo(() => {
    return parentBreakdown
      .filter((p) => p.totalAmount > 0)
      .sort((a, b) => b.totalAmount - a.totalAmount)
  }, [parentBreakdown])

  const total = ranked.reduce((sum, p) => sum + p.totalAmount, 0)

  const categoryMap = useMemo(() => {
    const map = new Map<number, ExpenseCategory>()
    categories?.forEach((c) => map.set(c.rowId, c))
    return map
  }, [categories])

  const chartData = useMemo(() => {
    return ranked.map((p, i) => {
      const cat = categoryMap.get(p.categoryRowId)
      return {
        name: p.categoryName,
        value: p.totalAmount,
        percentage: total > 0 ? Math.round((p.totalAmount / total) * 1000) / 10 : 0,
        fill: cat?.color || CHART_COLORS[i % CHART_COLORS.length],
        icon: cat?.icon || null,
        rowId: p.categoryRowId,
      }
    })
  }, [ranked, categoryMap, total])

  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {}
    chartData.forEach((item) => {
      config[item.name] = { label: item.name, color: item.fill ?? '#6b7280' }
    })
    return config
  }, [chartData])

  const selectedParent = useMemo(() => {
    if (!selectedParentId) return null
    return ranked.find((p) => p.categoryRowId === selectedParentId) ?? null
  }, [selectedParentId, ranked])

  const handleCategoryClick = useCallback((rowId: number) => {
    setSelectedParentId((prev) => (prev === rowId ? null : rowId))
  }, [])

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border p-5">
        <h3 className="mb-3 text-sm font-semibold">{t('stats.categoryDonut')}</h3>
        <p className="py-8 text-center text-sm text-muted-foreground">{t('stats.noData')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-5">
        <h3 className="mb-4 text-sm font-semibold">{t('stats.categoryDonut')}</h3>

        <div className={isMobile ? 'space-y-4' : 'grid grid-cols-2 gap-6'}>
          {/* Donut chart */}
          <div className="relative flex items-center justify-center">
            <ChartContainer config={chartConfig} className="aspect-square max-h-[220px] w-full">
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
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="85%"
                  paddingAngle={3}
                  strokeWidth={3}
                  stroke="hsl(var(--background))"
                  onClick={(_, index) => { if (chartData[index]) handleCategoryClick(chartData[index].rowId) }}
                  className="cursor-pointer"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill}
                      opacity={selectedParentId && selectedParentId !== entry.rowId ? 0.3 : 1}
                    />
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

          {/* Category list with icons */}
          <div className="space-y-1">
            {chartData.map((item) => (
              <div
                key={item.rowId}
                onClick={() => handleCategoryClick(item.rowId)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors cursor-pointer ${
                  selectedParentId === item.rowId
                    ? 'bg-primary/10 ring-1 ring-primary/30'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base"
                  style={{ backgroundColor: item.fill + '20' }}
                >
                  {item.icon || '📁'}
                </div>
                <span className="flex-1 truncate text-sm font-medium">{item.name}</span>
                <span className="text-sm font-bold tabular-nums">{formatCurrency(item.value)}</span>
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                  {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Drill-down panel */}
      {selectedParent && (
        <CategoryDrillDown
          parentCategory={{
            rowId: selectedParent.categoryRowId,
            name: selectedParent.categoryName,
            icon: categoryMap.get(selectedParent.categoryRowId)?.icon,
            totalAmount: selectedParent.totalAmount,
          }}
          children={selectedParent.children}
          categories={categories}
          onClose={() => setSelectedParentId(null)}
          onViewTransactions={onViewTransactions}
        />
      )}

      {/* Category trend chart */}
      <div className="rounded-xl border p-5">
        <h3 className="mb-3 text-sm font-semibold">{t('stats.categoryTrend')}</h3>
        <CategoryTrendChart monthlyAmounts={filteredMonthlyAmounts} categories={categories} />
      </div>
    </div>
  )
}
