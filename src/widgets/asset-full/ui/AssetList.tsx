import { useTranslation } from 'react-i18next'
import type { Asset } from '@/entities/asset'
import { formatCurrency } from '@/shared/lib'

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
      {assets.map((asset) => (
        <div
          key={asset.rowId}
          className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm"
            style={{ backgroundColor: asset.color || '#6b7280', color: '#fff' }}
          >
            {asset.icon || asset.assetName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{asset.assetName}</span>
              <span className="text-xs text-muted-foreground">{t(getAssetTypeLabel(asset.assetType))}</span>
            </div>
            {asset.institution && (
              <p className="text-xs text-muted-foreground">{asset.institution}</p>
            )}
          </div>
          <div className="text-right">
            <span className={`text-sm font-semibold ${asset.balance >= 0 ? 'text-foreground' : 'text-red-600'}`}>
              {formatCurrency(asset.balance)}
            </span>
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => onEdit(asset)}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onDelete(asset.rowId)}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
