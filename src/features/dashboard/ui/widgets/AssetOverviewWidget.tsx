import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { PieChart, Pie, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/shared/ui/chart'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
import { assetApi } from '@/features/asset/api/assetApi'
import { assetKeys } from '@/shared/config'
import type { AssetType, AssetTypeSummary } from '@/entities/asset'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원'
}

const ASSET_TYPE_KEYS: Record<AssetType, string> = {
  BANK_ACCOUNT: 'asset.bankAccount',
  CREDIT_CARD: 'asset.creditCard',
  CHECK_CARD: 'asset.checkCard',
  CASH: 'asset.cash',
  SAVINGS: 'asset.savings',
  LOAN: 'asset.loan',
  INVESTMENT: 'asset.investment',
}

const ASSET_TYPE_COLORS: Record<AssetType, string> = {
  BANK_ACCOUNT: '#3b82f6',
  CREDIT_CARD: '#ef4444',
  CHECK_CARD: '#22c55e',
  CASH: '#f59e0b',
  SAVINGS: '#8b5cf6',
  LOAN: '#ec4899',
  INVESTMENT: '#14b8a6',
}

const DEBT_TYPES: AssetType[] = ['CREDIT_CARD', 'LOAN']

export const AssetOverviewWidget = () => {
  const { t } = useTranslation('dashboard')
  const [activeTab, setActiveTab] = useState<'asset' | 'debt'>('asset')

  const { data, isLoading } = useQuery({
    queryKey: assetKeys.summary(),
    queryFn: () => assetApi.getAssetSummary(),
  })

  // 자산/부채 분리
  const { assetItems, debtItems, totalAsset, totalDebt, netAsset } = useMemo(() => {
    if (!data?.byType) {
      return { assetItems: [], debtItems: [], totalAsset: 0, totalDebt: 0, netAsset: 0 }
    }

    const assets: AssetTypeSummary[] = []
    const debts: AssetTypeSummary[] = []

    data.byType.forEach((item) => {
      if (DEBT_TYPES.includes(item.assetType)) {
        debts.push(item)
      } else {
        assets.push(item)
      }
    })

    const tAsset = assets.reduce((sum, a) => sum + a.totalBalance, 0)
    const tDebt = debts.reduce((sum, d) => sum + Math.abs(d.totalBalance), 0)

    return {
      assetItems: assets.sort((a, b) => b.totalBalance - a.totalBalance),
      debtItems: debts.sort((a, b) => Math.abs(b.totalBalance) - Math.abs(a.totalBalance)),
      totalAsset: tAsset,
      totalDebt: tDebt,
      netAsset: tAsset - tDebt,
    }
  }, [data])

  // 도넛 차트 데이터
  const chartData = useMemo(() => {
    const items = activeTab === 'asset' ? assetItems : debtItems
    const total = activeTab === 'asset' ? totalAsset : totalDebt
    if (items.length === 0 || total === 0) return []

    return items.map((item) => ({
      name: t(ASSET_TYPE_KEYS[item.assetType] ?? item.assetType),
      value: Math.abs(item.totalBalance),
      percentage: Math.round((Math.abs(item.totalBalance) / total) * 1000) / 10,
      fill: ASSET_TYPE_COLORS[item.assetType] ?? '#6b7280',
      assetType: item.assetType,
    }))
  }, [activeTab, assetItems, debtItems, totalAsset, totalDebt, t])

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {}
    chartData.forEach((item) => {
      config[item.name] = {
        label: item.name,
        color: item.fill,
      }
    })
    return config
  }, [chartData])

  const centerTotal = activeTab === 'asset' ? totalAsset : totalDebt

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!data || data.byType.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">{t('asset.noData')}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden p-4">
      {/* 도넛 차트 */}
      <div className="relative flex shrink-0 items-center justify-center">
        <ChartContainer config={chartConfig} className="aspect-square h-full max-h-[220px] w-full">
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
              strokeWidth={3}
              stroke="var(--background)"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">{t('asset.netAsset')}</p>
            <p className={`text-sm font-bold tabular-nums ${netAsset >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {netAsset < 0 ? '-' : ''}{formatCurrency(Math.abs(netAsset))}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {activeTab === 'asset' ? t('asset.totalAsset') : t('asset.totalDebt')}: {formatCurrency(centerTotal)}
            </p>
          </div>
        </div>
      </div>

      {/* 자산/부채 탭 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'asset' | 'debt')} className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 justify-center">
          <TabsList>
            <TabsTrigger value="asset">{t('asset.assetTab')}</TabsTrigger>
            <TabsTrigger value="debt">{t('asset.debtTab')}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="asset" className="min-h-0 flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            {assetItems.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">{t('noData')}</p>
            ) : (
              assetItems.map((item) => {
                const pct = totalAsset > 0 ? Math.round((item.totalBalance / totalAsset) * 1000) / 10 : 0
                return (
                  <div key={item.assetType} className="flex items-center gap-3 border-b py-2.5 last:border-b-0">
                    <div
                      className="h-8 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: ASSET_TYPE_COLORS[item.assetType] }}
                    />
                    <span className="flex-1 truncate text-sm font-medium">
                      {t(ASSET_TYPE_KEYS[item.assetType] ?? item.assetType)}
                    </span>
                    <span className="text-sm font-bold tabular-nums">{formatCurrency(item.totalBalance)}</span>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                      {pct}%
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="debt" className="min-h-0 flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            {debtItems.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">{t('noData')}</p>
            ) : (
              debtItems.map((item) => {
                const absBalance = Math.abs(item.totalBalance)
                const pct = totalDebt > 0 ? Math.round((absBalance / totalDebt) * 1000) / 10 : 0
                return (
                  <div key={item.assetType} className="flex items-center gap-3 border-b py-2.5 last:border-b-0">
                    <div
                      className="h-8 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: ASSET_TYPE_COLORS[item.assetType] }}
                    />
                    <span className="flex-1 truncate text-sm font-medium">
                      {t(ASSET_TYPE_KEYS[item.assetType] ?? item.assetType)}
                    </span>
                    <span className="text-sm font-bold tabular-nums text-red-600">{formatCurrency(absBalance)}</span>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                      {pct}%
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
