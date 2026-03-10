import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { assetApi } from '@/features/asset/api/assetApi'
import { assetKeys } from '@/shared/config'
import type { AssetType } from '@/entities/asset'

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

export const AssetOverviewWidget = () => {
  const { t } = useTranslation('dashboard')

  const { data, isLoading } = useQuery({
    queryKey: assetKeys.summary(),
    queryFn: () => assetApi.getAssetSummary(),
  })

  const maxBalance = useMemo(() => {
    if (!data?.byType) return 1
    return Math.max(...data.byType.map((a) => Math.abs(a.totalBalance)), 1)
  }, [data])

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
        <p className="text-sm text-muted-foreground">{t('noData')}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="text-center">
        <p className="text-xs text-muted-foreground">{t('asset.totalBalance')}</p>
        <p className="text-xl font-bold tabular-nums">{formatCurrency(data.totalBalance)}</p>
      </div>
      <div className="flex flex-col gap-2 overflow-y-auto">
        {data.byType.map((item) => (
          <div key={item.assetType} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {t(ASSET_TYPE_KEYS[item.assetType] ?? item.assetType)}
              </span>
              <span className="font-medium tabular-nums">{formatCurrency(item.totalBalance)}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(Math.abs(item.totalBalance) / maxBalance) * 100}%`,
                  backgroundColor: ASSET_TYPE_COLORS[item.assetType] ?? '#6b7280',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
