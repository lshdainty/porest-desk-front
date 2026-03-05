import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { PieChart, Pie, Cell } from 'recharts'
import { ChevronLeft } from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/shared/ui/chart'
import { formatCurrency } from '@/shared/lib'
import type { CategoryBreakdown, ParentCategoryBreakdown } from '@/entities/expense'
import { aggregateByParent } from '@/entities/expense'

interface ExpenseChartProps {
  breakdown: CategoryBreakdown[]
}

const COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
]

export const ExpenseChart = ({ breakdown }: ExpenseChartProps) => {
  const { t } = useTranslation('expense')
  const [selectedParent, setSelectedParent] = useState<ParentCategoryBreakdown | null>(null)

  const parentBreakdown = useMemo(() => aggregateByParent(breakdown), [breakdown])

  const displayData = useMemo(() => {
    if (selectedParent) {
      return selectedParent.children.map((item, index) => ({
        name: item.categoryName,
        value: item.totalAmount,
        fill: `var(--color-category-${index})`,
      }))
    }
    return parentBreakdown.map((item, index) => ({
      name: item.categoryName,
      value: item.totalAmount,
      fill: `var(--color-category-${index})`,
    }))
  }, [selectedParent, parentBreakdown])

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {}
    const items = selectedParent ? selectedParent.children : parentBreakdown
    items.forEach((item, index) => {
      config[`category-${index}`] = {
        label: item.categoryName,
        color: COLORS[index % COLORS.length],
      }
    })
    return config
  }, [selectedParent, parentBreakdown])

  const handlePieClick = useCallback((_data: unknown, index: number) => {
    if (!selectedParent && parentBreakdown[index]?.children.length > 0) {
      setSelectedParent(parentBreakdown[index])
    }
  }, [selectedParent, parentBreakdown])

  const handleBack = useCallback(() => {
    setSelectedParent(null)
  }, [])

  if (breakdown.length === 0) return null

  return (
    <div className="h-48 w-full">
      {selectedParent && (
        <button
          onClick={handleBack}
          className="mb-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={14} />
          {selectedParent.categoryName}
        </button>
      )}
      <ChartContainer config={chartConfig} className="mx-auto aspect-square h-full">
        <PieChart>
          <Pie
            data={displayData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            onClick={handlePieClick}
            style={{ cursor: selectedParent ? 'default' : 'pointer' }}
          >
            {displayData.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={`var(--color-category-${index})`} />
            ))}
          </Pie>
          <ChartTooltip
            content={
              <ChartTooltipContent
                nameKey="name"
                hideLabel
                formatter={(value, name, item) => (
                  <>
                    <div
                      className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                      style={
                        {
                          backgroundColor: (item as Record<string, unknown>)?.payload
                            ? ((item as Record<string, unknown>).payload as Record<string, string>).fill
                            : undefined,
                        }
                      }
                    />
                    <div className="flex flex-1 items-center justify-between gap-2 leading-none">
                      <span className="text-muted-foreground">{name}</span>
                      <span className="ml-2 font-mono font-medium tabular-nums text-foreground">
                        {formatCurrency(value as number)}
                      </span>
                    </div>
                  </>
                )}
              />
            }
          />
        </PieChart>
      </ChartContainer>
    </div>
  )
}
