import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PieChart, Pie, Cell } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/shared/ui/chart'
import { formatCurrency } from '@/shared/lib'
import type { AssetExpenseSummary } from '@/entities/expense'

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
  '#14b8a6', '#f43f5e', '#6366f1', '#84cc16', '#06b6d4',
]

const RADIAN = Math.PI / 180

const formatCompactAmount = (value: number): string => {
  if (value >= 1000000) {
    return `${Math.round(value / 10000)}만`
  }
  if (value >= 10000) {
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

interface AssetUsageChartProps {
  assets: AssetExpenseSummary[]
}

export const AssetUsageChart = ({ assets }: AssetUsageChartProps) => {
  const { t } = useTranslation('expense')

  const displayData = useMemo(() => {
    return assets
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .map((a, index) => ({
        name: a.assetName,
        value: a.totalAmount,
        count: a.count,
        fill: `var(--color-asset-${index})`,
      }))
  }, [assets])

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {}
    assets.forEach((a, index) => {
      config[`asset-${index}`] = {
        label: a.assetName,
        color: COLORS[index % COLORS.length],
      }
    })
    return config
  }, [assets])

  if (assets.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-sm text-muted-foreground">{t('stats.noAssetData')}</p>
      </div>
    )
  }

  return (
    <div className="w-full">
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
          >
            {displayData.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={`var(--color-asset-${index})`} />
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
                      style={{
                        backgroundColor: (item as Record<string, unknown>)?.payload
                          ? ((item as Record<string, unknown>).payload as Record<string, string>).fill
                          : undefined,
                      }}
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
