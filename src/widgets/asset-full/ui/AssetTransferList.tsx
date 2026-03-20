import { useTranslation } from 'react-i18next'
import type { AssetTransfer } from '@/entities/asset'
import { formatCurrency } from '@/shared/lib'

interface AssetTransferListProps {
  transfers: AssetTransfer[]
  onDelete: (id: number) => void
  isDeleting?: boolean
}

export const AssetTransferList = ({ transfers, onDelete, isDeleting }: AssetTransferListProps) => {
  const { t } = useTranslation('asset')

  if (transfers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm">{t('noTransfers')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {transfers.map((transfer) => (
        <div
          key={transfer.rowId}
          className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{transfer.fromAssetName}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-medium">{transfer.toAssetName}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{transfer.transferDate}</span>
              {transfer.description && <span>· {transfer.description}</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{formatCurrency(transfer.amount)}</p>
            {transfer.fee > 0 && (
              <p className="text-xs text-muted-foreground">{t('fee')}: {formatCurrency(transfer.fee)}</p>
            )}
          </div>
          <button
            className="shrink-0 rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
            onClick={() => onDelete(transfer.rowId)}
            disabled={isDeleting}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
