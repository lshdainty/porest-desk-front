import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/shared/ui/chart'
import type { AssetSummary, Asset, AssetType } from '@/entities/asset'
import { formatCurrency } from '@/shared/lib'

const ASSET_TYPE_COLORS: Record<AssetType, string> = {
  BANK_ACCOUNT: '#3B82F6',
  CREDIT_CARD: '#EF4444',
  CASH: '#22C55E',
  SAVINGS: '#10B981',
  LOAN: '#F97316',
  INVESTMENT: '#8B5CF6',
  CHECK_CARD: '#6366F1',
}

interface AssetSummaryCardProps {
  summary: AssetSummary
  assets?: Asset[]
}

export const AssetSummaryCard = ({ summary, assets = [] }: AssetSummaryCardProps) => {
  const { t } = useTranslation('asset')

  const netWorth = useMemo(() => {
    if (assets.length === 0) return summary.totalBalance
    return assets
      .filter((a) => a.isIncludedInTotal === 'Y')
      .reduce((sum, a) => sum + a.balance, 0)
  }, [assets, summary.totalBalance])

  const chartData = useMemo(() => {
    return summary.byType
      .filter((item) => item.totalBalance !== 0)
      .map((item) => ({
        name: item.assetType,
        value: Math.abs(item.totalBalance),
        fill: ASSET_TYPE_COLORS[item.assetType] || '#6B7280',
      }))
  }, [summary.byType])

  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {}
    summary.byType.forEach((item) => {
      config[item.assetType] = {
        label: item.assetType,
        color: ASSET_TYPE_COLORS[item.assetType] || '#6B7280',
      }
    })
    return config
  }, [summary.byType])

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      {/* Net worth card */}
      <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-4 text-center">
        <p className="text-xs text-muted-foreground">{t('totalBalance')}</p>
        <p className="text-2xl font-bold">{formatCurrency(netWorth)}</p>
        {assets.length > 0 && netWorth !== summary.totalBalance && (
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            전체: {formatCurrency(summary.totalBalance)}
          </p>
        )}
      </div>

      {/* Donut chart + type breakdown */}
      {chartData.length > 0 && (
        <div className="flex flex-col items-center gap-4 md:flex-row">
          <div className="w-full md:w-1/2">
            <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[180px]">
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  }
                />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>
          <div className="w-full md:w-1/2">
            <div className="grid grid-cols-2 gap-2">
              {summary.byType.map((item) => (
                <div key={item.assetType} className="flex items-start gap-2 rounded-md bg-muted/50 p-2">
                  <div
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: ASSET_TYPE_COLORS[item.assetType] || '#6B7280' }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">
                      {t(`assetType.${item.assetType.toLowerCase().replace(/_/g, '')}`)}
                    </p>
                    <p className="text-sm font-semibold">{formatCurrency(item.totalBalance)}</p>
                    <p className="text-xs text-muted-foreground">{item.count}{t('count')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
