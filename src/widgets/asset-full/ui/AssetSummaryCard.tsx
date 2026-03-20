import { useTranslation } from 'react-i18next'
import type { AssetSummary } from '@/entities/asset'
import { formatCurrency } from '@/shared/lib'

interface AssetSummaryCardProps {
  summary: AssetSummary
}

export const AssetSummaryCard = ({ summary }: AssetSummaryCardProps) => {
  const { t } = useTranslation('asset')

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3">
        <p className="text-xs text-muted-foreground">{t('totalBalance')}</p>
        <p className="text-2xl font-bold">{formatCurrency(summary.totalBalance)}</p>
      </div>
      {summary.byType.length > 0 && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {summary.byType.map((item) => (
            <div key={item.assetType} className="rounded-md bg-muted/50 p-2">
              <p className="text-xs text-muted-foreground">
                {t(`assetType.${item.assetType.toLowerCase().replace(/_/g, '')}`)}
              </p>
              <p className="text-sm font-semibold">{formatCurrency(item.totalBalance)}</p>
              <p className="text-xs text-muted-foreground">{item.count}{t('count')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
