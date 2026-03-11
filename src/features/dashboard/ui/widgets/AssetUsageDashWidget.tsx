import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAssetExpenseSummary } from '@/features/expense'
import { AssetUsageChart } from '@/widgets/expense-full/ui/summary/AssetUsageChart'

export const AssetUsageDashWidget = () => {
  const { t } = useTranslation('dashboard')
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const { startDate, endDate } = useMemo(() => {
    let startM = month - 5
    let startY = year
    while (startM <= 0) { startM += 12; startY-- }
    const sd = `${startY}-${String(startM).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const ed = `${year}-${String(month).padStart(2, '0')}-${lastDay}`
    return { startDate: sd, endDate: ed }
  }, [year, month])

  const { data, isLoading } = useAssetExpenseSummary(startDate, endDate)

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!data?.assets || data.assets.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">{t('noData')}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col p-3">
      <AssetUsageChart assets={data.assets} />
    </div>
  )
}
