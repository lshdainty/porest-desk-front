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

const RADIAN = Math.PI / 180

const formatCompactAmount = (value: number): string => {
  if (value >= 1000000) {
    // 100만 이상: 소수점 없이 (예: 371만)
    return `${Math.round(value / 10000)}만`
  }
  if (value >= 10000) {
    // 1만 이상: 소수점 1자리 (예: 27.7만)
    const man = value / 10000
    return man % 1 === 0 ? `${man}만` : `${man.toFixed(1)}만`
  }
  return value.toLocaleString()
}

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  outerRadius,
  value,
  percent,
}: {
  cx: number
  cy: number
  midAngle: number
  outerRadius: number
  value: number
  percent: number
}) => {
  // 비율이 1% 미만이면 라벨 표시하지 않음
  if (percent < 0.01) return null

  const radius = outerRadius + 28
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="fill-foreground text-[11px] font-medium"
    >
      {formatCompactAmount(value)}
    </text>
  )
}

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
    <div className="w-full">
      {selectedParent && (
        <button
          onClick={handleBack}
          className="mb-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={14} />
          {selectedParent.categoryName}
        </button>
      )}
      <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[280px]">
        <PieChart margin={{ top: 25, right: 50, bottom: 25, left: 50 }}>
          <Pie
            data={displayData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            label={renderCustomizedLabel}
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

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-1">
        {displayData.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-xs text-muted-foreground">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
