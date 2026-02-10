import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { Asset, AssetTransferFormValues } from '@/entities/asset'

interface AssetTransferFormProps {
  assets: Asset[]
  onSubmit: (data: AssetTransferFormValues) => void
  onClose: () => void
  isLoading: boolean
}

export const AssetTransferForm = ({ assets, onSubmit, onClose, isLoading }: AssetTransferFormProps) => {
  const { t } = useTranslation('asset')
  const { t: tc } = useTranslation('common')

  const [fromAssetRowId, setFromAssetRowId] = useState<number>(assets[0]?.rowId ?? 0)
  const [toAssetRowId, setToAssetRowId] = useState<number>(assets[1]?.rowId ?? 0)
  const [amount, setAmount] = useState('')
  const [fee, setFee] = useState('')
  const [description, setDescription] = useState('')
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0])

  const handleSubmit = useCallback(() => {
    if (!fromAssetRowId || !toAssetRowId || !amount || fromAssetRowId === toAssetRowId) return

    onSubmit({
      fromAssetRowId,
      toAssetRowId,
      amount: parseInt(amount),
      fee: fee ? parseInt(fee) : undefined,
      description: description || undefined,
      transferDate,
    })
  }, [fromAssetRowId, toAssetRowId, amount, fee, description, transferDate, onSubmit])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">{t('addTransfer')}</h2>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('form.fromAsset')}</label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={fromAssetRowId}
              onChange={(e) => setFromAssetRowId(Number(e.target.value))}
            >
              {assets.map((asset) => (
                <option key={asset.rowId} value={asset.rowId}>{asset.assetName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t('form.toAsset')}</label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={toAssetRowId}
              onChange={(e) => setToAssetRowId(Number(e.target.value))}
            >
              {assets.map((asset) => (
                <option key={asset.rowId} value={asset.rowId}>{asset.assetName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t('form.amount')}</label>
            <input
              type="number"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t('form.amountPlaceholder')}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t('form.fee')}</label>
            <input
              type="number"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder="0"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t('form.date')}</label>
            <input
              type="date"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t('form.description')}</label>
            <input
              type="text"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('form.descriptionPlaceholder')}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            className="rounded-md px-4 py-2 text-sm hover:bg-muted"
            onClick={onClose}
            disabled={isLoading}
          >
            {tc('cancel')}
          </button>
          <button
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            onClick={handleSubmit}
            disabled={isLoading || !amount || fromAssetRowId === toAssetRowId}
          >
            {tc('save')}
          </button>
        </div>
      </div>
    </div>
  )
}
