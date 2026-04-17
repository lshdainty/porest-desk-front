import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2 } from 'lucide-react'
import type { Asset } from '@/entities/asset'
import { cn, formatCurrency, renderIcon } from '@/shared/lib'

interface AssetListProps {
  assets: Asset[]
  onEdit: (asset: Asset) => void
  onDelete: (id: number) => void
}

const getAssetTypeLabel = (assetType: string): string => {
  return `assetType.${assetType.toLowerCase().replace(/_/g, '')}`
}

export const AssetList = ({ assets, onEdit, onDelete }: AssetListProps) => {
  const { t } = useTranslation('asset')

  // Total of positive balances included in net worth — used for the weight bar.
  const positiveTotal = useMemo(() => {
    return assets
      .filter((a) => a.isIncludedInTotal === 'Y' && a.balance > 0)
      .reduce((sum, a) => sum + a.balance, 0)
  }, [assets])

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm">{t('noAssets')}</p>
        <p className="text-xs">{t('createFirst')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {assets.map((asset) => {
        const weight =
          positiveTotal > 0 && asset.isIncludedInTotal === 'Y' && asset.balance > 0
            ? (asset.balance / positiveTotal) * 100
            : 0

        return (
          <div
            key={asset.rowId}
            className="group rounded-xl border p-3 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm"
                style={{ backgroundColor: asset.color || '#6b7280', color: '#fff' }}
              >
                {renderIcon(asset.icon, asset.assetName.charAt(0), 20)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{asset.assetName}</span>
                  <span className="text-[10px] rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                    {t(getAssetTypeLabel(asset.assetType))}
                  </span>
                </div>
                {asset.institution && (
                  <p className="text-xs text-muted-foreground truncate">{asset.institution}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <span
                  className={cn(
                    'text-sm font-semibold tabular-nums',
                    asset.balance >= 0 ? 'text-foreground' : 'text-red-600 dark:text-red-400',
                  )}
                >
                  {formatCurrency(asset.balance)}
                </span>
                {weight > 0 && (
                  <p className="text-[10px] text-muted-foreground tabular-nums">
                    {weight.toFixed(0)}%
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  onClick={() => onEdit(asset)}
                >
                  <Pencil size={14} />
                </button>
                <button
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  onClick={() => onDelete(asset.rowId)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {weight > 0 && (
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/70 transition-all"
                  style={{ width: `${Math.min(weight, 100)}%` }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
