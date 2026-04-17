import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
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
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:pointer-events-none disabled:opacity-50"
            onClick={() => onDelete(transfer.rowId)}
            disabled={isDeleting}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
