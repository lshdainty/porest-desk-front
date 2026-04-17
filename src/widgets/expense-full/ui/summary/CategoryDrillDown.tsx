import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { X, ArrowRight } from 'lucide-react'
import { PieChart, Pie, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/shared/ui/chart'
import { formatCurrency } from '@/shared/lib'
import type { CategoryBreakdown, ExpenseCategory } from '@/entities/expense'

const CHART_COLORS = [
  '#f97316', '#14b8a6', '#3b82f6', '#f59e0b', '#8b5cf6',
  '#ec4899', '#10b981', '#6366f1', '#84cc16', '#06b6d4',
]

interface CategoryDrillDownProps {
  parentCategory: { rowId: number; name: string; icon?: string | null; totalAmount: number }
  children: CategoryBreakdown[]
  categories?: ExpenseCategory[]
  onClose: () => void
  onViewTransactions?: (categoryId: number) => void
}

export const CategoryDrillDown = ({
  parentCategory,
  children,
  categories,
  onClose,
  onViewTransactions,
}: CategoryDrillDownProps) => {
  const { t } = useTranslation('expense')

  const categoryMap = useMemo(() => {
    const map = new Map<number, ExpenseCategory>()
    categories?.forEach((c) => map.set(c.rowId, c))
    return map
  }, [categories])

  const total = children.reduce((sum, c) => sum + c.totalAmount, 0)

  const chartData = useMemo(() => {
    return children
      .filter((c) => c.totalAmount > 0)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .map((c, i) => {
        const cat = categoryMap.get(c.categoryRowId)
        return {
          name: c.categoryName,
          value: c.totalAmount,
          percentage: total > 0 ? Math.round((c.totalAmount / total) * 1000) / 10 : 0,
          fill: cat?.color || CHART_COLORS[i % CHART_COLORS.length],
          icon: cat?.icon || null,
        }
      })
  }, [children, categoryMap, total])

  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {}
    chartData.forEach((item) => {
      config[item.name] = { label: item.name, color: item.fill ?? '#6b7280' }
    })
    return config
  }, [chartData])

  if (children.length === 0) {
    return (
      <div className="rounded-xl border bg-muted/20 p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            {parentCategory.icon && <span>{parentCategory.icon}</span>}
            {parentCategory.name}
          </h4>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted transition-colors">
            <X size={16} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">{t('stats.noData')}</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-muted/20 p-5 animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          {parentCategory.icon && <span className="text-base">{parentCategory.icon}</span>}
          {parentCategory.name}
          <span className="text-muted-foreground font-normal">
            {formatCurrency(parentCategory.totalAmount)}
          </span>
        </h4>
        <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Sub-category donut */}
        <div className="relative flex items-center justify-center">
          <ChartContainer config={chartConfig} className="aspect-square max-h-[180px] w-full">
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
                innerRadius="55%"
                outerRadius="85%"
                paddingAngle={3}
                strokeWidth={2}
                stroke="var(--background)"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>

        {/* Sub-category list */}
        <div className="space-y-1">
          {chartData.map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => {
                const cat = children.find((c) => c.categoryName === item.name)
                if (cat && onViewTransactions) onViewTransactions(cat.categoryRowId)
              }}
            >
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm"
                style={{ backgroundColor: item.fill + '20' }}
              >
                {item.icon || '📁'}
              </div>
              <span className="flex-1 truncate text-sm">{item.name}</span>
              <span className="text-sm font-semibold tabular-nums">{formatCurrency(item.value)}</span>
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* View transactions button */}
      {onViewTransactions && (
        <button
          onClick={() => onViewTransactions(parentCategory.rowId)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {t('viewTransactions', '내역 보기')}
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  )
}
